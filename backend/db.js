const Database = require('better-sqlite3')

const db = new Database(process.env.DB_PATH || 'agendamento.db')

db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    duracao_min INTEGER NOT NULL,
    preco REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    data_hora DATETIME NOT NULL,
    status TEXT DEFAULT 'confirmado',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (servico_id) REFERENCES servicos(id)
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL
  );
`)

// O banco deixou de ser versionado no git, então o catálogo inicial
// é criado aqui quando a tabela de serviços está vazia.
const { total } = db.prepare('SELECT COUNT(*) AS total FROM servicos').get()
if (total === 0) {
  const inserir = db.prepare('INSERT INTO servicos (nome, duracao_min, preco) VALUES (?, ?, ?)')
  inserir.run('Corte de cabelo', 30, 40)
  inserir.run('Corte de barba', 25, 40)
  inserir.run('Corte cabelo + barba', 55, 70)
}

module.exports = db
