const db = require('./db')
const criarApp = require('./app')
const { garantirAdmin } = require('./auth')

if (!process.env.JWT_SECRET) {
  console.error('Defina a variável de ambiente JWT_SECRET antes de iniciar o servidor.')
  process.exit(1)
}

try {
  if (garantirAdmin(db, process.env.ADMIN_EMAIL, process.env.ADMIN_SENHA)) {
    console.log(`Administrador ${process.env.ADMIN_EMAIL} criado.`)
  }
} catch (err) {
  console.error(err.message)
  process.exit(1)
}

const PORT = process.env.PORT || 3000

criarApp(db).listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
