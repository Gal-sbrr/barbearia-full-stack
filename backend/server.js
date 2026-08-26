const cors = require('cors')
const express = require('express')
const db = require('./db')
const app = express()
app.use(express.json())
app.use(cors())
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('API rodando!')
})

app.get('/clientes', (req, res) => {
  const clientes = db.prepare('SELECT * FROM clientes').all()
  res.json(clientes)
})

app.post('/clientes', (req, res) => {
  const { nome, telefone, email } = req.body

  if (!nome || !telefone) {
    return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' })
  }

  const stmt = db.prepare('INSERT INTO clientes (nome, telefone, email) VALUES (?, ?, ?)')
  const resultado = stmt.run(nome, telefone, email || null)

  res.status(201).json({ id: resultado.lastInsertRowid, nome, telefone, email })
})

app.post('/servicos', (req, res) => {
  const { nome, duracao_min, preco } = req.body

  if (!nome || !duracao_min || !preco) {
    return res.status(400).json({ erro: 'Nome, duração e preço são obrigatórios' })
  }

  const stmt = db.prepare('INSERT INTO servicos (nome, duracao_min, preco) VALUES (?, ?, ?)')
  const resultado = stmt.run(nome, duracao_min, preco)

  res.status(201).json({ id: resultado.lastInsertRowid, nome, duracao_min, preco })
})

app.get('/servicos', (req, res) => {
  const servicos = db.prepare('SELECT * FROM servicos').all()
  res.json(servicos)
})

app.post('/agendamentos', (req, res) => {
  const { cliente_id, servico_id, data_hora } = req.body

  if (!cliente_id || !servico_id || !data_hora) {
    return res.status(400).json({ erro: 'Cliente, serviço e data/hora são obrigatórios' })
  }

  const servico = db.prepare('SELECT * FROM servicos WHERE id = ?').get(servico_id)

  if (!servico) {
    return res.status(404).json({ erro: 'Serviço não encontrado' })
  }

  const conflito = db.prepare(`
    SELECT a.* FROM agendamentos a
    WHERE a.status = 'confirmado'
    AND datetime(a.data_hora) < datetime(?, '+' || ? || ' minutes')
    AND datetime(a.data_hora, '+' || (
      SELECT duracao_min FROM servicos WHERE id = a.servico_id
    ) || ' minutes') > datetime(?)
  `).get(data_hora, servico.duracao_min, data_hora)

  if (conflito) {
    return res.status(409).json({ erro: 'Já existe um agendamento nesse horário' })
  }

  const stmt = db.prepare('INSERT INTO agendamentos (cliente_id, servico_id, data_hora) VALUES (?, ?, ?)')
  const resultado = stmt.run(cliente_id, servico_id, data_hora)

  res.status(201).json({ id: resultado.lastInsertRowid, cliente_id, servico_id, data_hora, status: 'confirmado' })
})

app.get('/agendamentos', (req, res) => {
  const agendamentos = db.prepare(`
    SELECT 
      a.id, a.data_hora, a.status,
      c.nome AS cliente_nome, c.telefone AS cliente_telefone,
      s.nome AS servico_nome, s.duracao_min, s.preco
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    ORDER BY a.data_hora
  `).all()

  res.json(agendamentos)
})

app.patch('/agendamentos/:id/cancelar', (req, res) => {
  const { id } = req.params

  const agendamento = db.prepare('SELECT * FROM agendamentos WHERE id = ?').get(id)

  if (!agendamento) {
    return res.status(404).json({ erro: 'Agendamento não encontrado' })
  }

  db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run('cancelado', id)

  res.json({ id: Number(id), status: 'cancelado' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})