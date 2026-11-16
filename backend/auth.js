const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const EXPIRACAO = '8h'

function segredo() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET não definido')
  return s
}

function login(db) {
  return (req, res) => {
    const { email, senha } = req.body || {}

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' })
    }

    const admin = db.prepare('SELECT * FROM admin WHERE email = ?').get(email)
    // Mesma resposta para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
    if (!admin || !bcrypt.compareSync(senha, admin.senha_hash)) {
      return res.status(401).json({ erro: 'Credenciais inválidas' })
    }

    const token = jwt.sign({ sub: admin.id, email: admin.email }, segredo(), { expiresIn: EXPIRACAO })
    res.json({ token })
  }
}

function exigirAdmin(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ')

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Autenticação necessária' })
  }

  try {
    req.admin = jwt.verify(token, segredo())
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

// Cria o administrador inicial a partir de variáveis de ambiente, só se esse e-mail ainda não existir.
// Serve para deploys sem acesso a shell (ex.: plano gratuito do Render). Não altera senha de quem já existe.
function garantirAdmin(db, email, senha) {
  if (!email || !senha) return false
  if (senha.length < 8) throw new Error('ADMIN_SENHA precisa ter pelo menos 8 caracteres')

  const existe = db.prepare('SELECT id FROM admin WHERE email = ?').get(email)
  if (existe) return false

  db.prepare('INSERT INTO admin (email, senha_hash) VALUES (?, ?)').run(email, bcrypt.hashSync(senha, 10))
  return true
}

module.exports = { login, exigirAdmin, garantirAdmin }
