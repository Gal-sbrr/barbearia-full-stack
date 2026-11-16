process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'segredo-de-teste'

const { test, before } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const bcrypt = require('bcryptjs')

const db = require('../db')
const { garantirAdmin } = require('../auth')
const app = require('../app')(db)

let token
let clienteId

// Serviços do seed: 1 = cabelo (30 min), 2 = barba (25 min), 3 = cabelo + barba (55 min)
const agendar = (servico_id, data_hora) =>
  request(app).post('/agendamentos').send({ cliente_id: clienteId, servico_id, data_hora })

before(async () => {
  db.prepare('INSERT INTO admin (email, senha_hash) VALUES (?, ?)')
    .run('admin@teste.com', bcrypt.hashSync('senha-forte-123', 4))

  const res = await request(app).post('/auth/login').send({ email: 'admin@teste.com', senha: 'senha-forte-123' })
  token = res.body.token

  const cliente = await request(app).post('/clientes').send({ nome: 'Fulano', telefone: '16999990000' })
  clienteId = cliente.body.id
})

test('lista os serviços iniciais sem autenticação', async () => {
  const res = await request(app).get('/servicos')
  assert.equal(res.status, 200)
  assert.equal(res.body.length, 3)
})

test('cliente exige nome e telefone', async () => {
  const res = await request(app).post('/clientes').send({ nome: 'Sem telefone' })
  assert.equal(res.status, 400)
})

test('cria agendamento e rejeita conflito no mesmo horário', async () => {
  const primeiro = await agendar(1, '2030-01-15 10:00:00')
  assert.equal(primeiro.status, 201)

  const conflito = await agendar(1, '2030-01-15 10:00:00')
  assert.equal(conflito.status, 409)
})

test('rejeita horário que sobrepõe parte de outro agendamento', async () => {
  const res = await agendar(1, '2030-01-15 10:15:00')
  assert.equal(res.status, 409)
})

test('aceita horário que começa exatamente quando o anterior termina', async () => {
  const res = await agendar(1, '2030-01-15 10:30:00')
  assert.equal(res.status, 201)
})

test('a duração do serviço novo também conta no conflito', async () => {
  // cabelo + barba (55 min) às 09:30 terminaria 10:25 e invadiria o das 10:00
  const res = await agendar(3, '2030-01-15 09:30:00')
  assert.equal(res.status, 409)
})

test('rejeita data/hora em formato inválido', async () => {
  assert.equal((await agendar(1, 'amanhã de manhã')).status, 400)
  assert.equal((await agendar(1, '2030-13-45 10:00:00')).status, 400)
})

test('rejeita cliente e serviço inexistentes', async () => {
  const semCliente = await request(app).post('/agendamentos')
    .send({ cliente_id: 9999, servico_id: 1, data_hora: '2030-02-01 10:00:00' })
  assert.equal(semCliente.status, 404)

  const semServico = await agendar(9999, '2030-02-01 10:00:00')
  assert.equal(semServico.status, 404)
})

test('rotas do painel exigem autenticação', async () => {
  assert.equal((await request(app).get('/agendamentos')).status, 401)
  assert.equal((await request(app).get('/clientes')).status, 401)
  assert.equal((await request(app).patch('/agendamentos/1/cancelar')).status, 401)
  assert.equal((await request(app).post('/servicos').send({ nome: 'x', duracao_min: 10, preco: 10 })).status, 401)
})

test('token inválido é recusado', async () => {
  const res = await request(app).get('/agendamentos').set('Authorization', 'Bearer token-falso')
  assert.equal(res.status, 401)
})

test('login falha com senha errada e com e-mail inexistente', async () => {
  const senhaErrada = await request(app).post('/auth/login').send({ email: 'admin@teste.com', senha: 'errada' })
  const semUsuario = await request(app).post('/auth/login').send({ email: 'ninguem@teste.com', senha: 'senha-forte-123' })
  assert.equal(senhaErrada.status, 401)
  assert.equal(semUsuario.status, 401)
  assert.deepEqual(senhaErrada.body, semUsuario.body)
})

test('admin autenticado lista agendamentos com dados do cliente', async () => {
  const res = await request(app).get('/agendamentos').set('Authorization', `Bearer ${token}`)
  assert.equal(res.status, 200)
  assert.ok(res.body.length >= 2)
  assert.equal(res.body[0].cliente_nome, 'Fulano')
})

test('cancelar libera o horário para novo agendamento', async () => {
  const criado = await agendar(2, '2030-03-10 14:00:00')
  assert.equal(criado.status, 201)
  assert.equal((await agendar(2, '2030-03-10 14:00:00')).status, 409)

  const cancelado = await request(app)
    .patch(`/agendamentos/${criado.body.id}/cancelar`)
    .set('Authorization', `Bearer ${token}`)
  assert.equal(cancelado.status, 200)
  assert.equal(cancelado.body.status, 'cancelado')

  assert.equal((await agendar(2, '2030-03-10 14:00:00')).status, 201)
})

test('cancelar agendamento inexistente retorna 404', async () => {
  const res = await request(app).patch('/agendamentos/9999/cancelar').set('Authorization', `Bearer ${token}`)
  assert.equal(res.status, 404)
})

test('admin cria serviço e valida valores positivos', async () => {
  const ok = await request(app).post('/servicos').set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Sobrancelha', duracao_min: 15, preco: 20 })
  assert.equal(ok.status, 201)

  const invalido = await request(app).post('/servicos').set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Grátis', duracao_min: 15, preco: -5 })
  assert.equal(invalido.status, 400)
})

test('garantirAdmin cria o admin uma vez e não troca a senha de quem já existe', () => {
  assert.equal(garantirAdmin(db, 'novo@teste.com', 'outra-senha-123'), true)
  assert.equal(garantirAdmin(db, 'novo@teste.com', 'senha-diferente-456'), false)

  const { senha_hash } = db.prepare('SELECT senha_hash FROM admin WHERE email = ?').get('novo@teste.com')
  assert.ok(bcrypt.compareSync('outra-senha-123', senha_hash))
})

test('garantirAdmin ignora variáveis ausentes e recusa senha curta', () => {
  assert.equal(garantirAdmin(db, undefined, undefined), false)
  assert.throws(() => garantirAdmin(db, 'curta@teste.com', '123'), /pelo menos 8/)
})
