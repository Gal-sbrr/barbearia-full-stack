// Uso: ADMIN_EMAIL=voce@exemplo.com ADMIN_SENHA='senha-forte' npm run criar-admin
// Cria o administrador ou, se o e-mail já existir, troca a senha dele.
const bcrypt = require('bcryptjs')
const db = require('../db')

const { ADMIN_EMAIL, ADMIN_SENHA } = process.env

if (!ADMIN_EMAIL || !ADMIN_SENHA) {
  console.error('Defina ADMIN_EMAIL e ADMIN_SENHA.')
  process.exit(1)
}

if (ADMIN_SENHA.length < 8) {
  console.error('A senha precisa ter pelo menos 8 caracteres.')
  process.exit(1)
}

const hash = bcrypt.hashSync(ADMIN_SENHA, 10)

db.prepare(`
  INSERT INTO admin (email, senha_hash) VALUES (?, ?)
  ON CONFLICT(email) DO UPDATE SET senha_hash = excluded.senha_hash
`).run(ADMIN_EMAIL, hash)

console.log(`Administrador ${ADMIN_EMAIL} pronto.`)
