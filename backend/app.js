const cors = require('cors')
const express = require('express')
const { login, exigirAdmin } = require('./auth')

const FORMATO_DATA_HORA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/

function criarApp(db) {
  const app = express()
  app.use(express.json())
  app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined))

  app.get('/', (req, res) => {
    res.send('API rodando!')
  })

  // ---------- Públicas (fluxo do cliente) ----------

  app.post('/auth/login', login(db))

  app.get('/servicos', (req, res) => {
    const servicos = db.prepare('SELECT * FROM servicos').all()
    res.json(servicos)
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

  app.post('/agendamentos', (req, res) => {
    const { cliente_id, servico_id, data_hora } = req.body

    if (!cliente_id || !servico_id || !data_hora) {
      return res.status(400).json({ erro: 'Cliente, serviço e data/hora são obrigatórios' })
    }

    if (!FORMATO_DATA_HORA.test(data_hora) || db.prepare('SELECT datetime(?) AS d').get(data_hora).d === null) {
      return res.status(400).json({ erro: 'Data/hora inválida. Use o formato AAAA-MM-DD HH:MM' })
    }

    const servico = db.prepare('SELECT * FROM servicos WHERE id = ?').get(servico_id)

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' })
    }

    const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(cliente_id)

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' })
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

  // ---------- Protegidas (painel do administrador) ----------

  app.get('/clientes', exigirAdmin, (req, res) => {
    const clientes = db.prepare('SELECT * FROM clientes').all()
    res.json(clientes)
  })

  app.post('/servicos', exigirAdmin, (req, res) => {
    const { nome, duracao_min, preco } = req.body

    if (!nome || !(duracao_min > 0) || !(preco > 0)) {
      return res.status(400).json({ erro: 'Nome, duração e preço (maiores que zero) são obrigatórios' })
    }

    const stmt = db.prepare('INSERT INTO servicos (nome, duracao_min, preco) VALUES (?, ?, ?)')
    const resultado = stmt.run(nome, duracao_min, preco)

    res.status(201).json({ id: resultado.lastInsertRowid, nome, duracao_min, preco })
  })

  app.get('/agendamentos', exigirAdmin, (req, res) => {
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

  app.patch('/agendamentos/:id/cancelar', exigirAdmin, (req, res) => {
    const { id } = req.params

    const agendamento = db.prepare('SELECT * FROM agendamentos WHERE id = ?').get(id)

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' })
    }

    db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run('cancelado', id)

    res.json({ id: Number(id), status: 'cancelado' })
  })

  return app
}

module.exports = criarApp
