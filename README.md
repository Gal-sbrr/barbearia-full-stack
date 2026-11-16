# União Barbearia — Sistema de Agendamento

Aplicação full-stack de agendamento online para barbearias, com painel administrativo e checagem automática de conflito de horários.

🔗 **Demo:** https://frontend-one-phi-61.vercel.app/
🔗 **API:** https://barbearia-full-stack.onrender.com

## Funcionalidades

- Agendamento de horário com seleção de serviço, data e hora
- Validação automática de conflitos de horário no backend
- Painel administrativo protegido por login (JWT) com listagem e cancelamento de agendamentos
- Cadastro de clientes e serviços via API REST

## Stack

**Frontend:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express, JWT (jsonwebtoken + bcryptjs)
**Testes:** node:test + supertest, rodando no GitHub Actions
**Banco de dados:** SQLite (better-sqlite3)
**Deploy:** Vercel (frontend) + Render (backend)

## Rodando localmente

Backend:
```bash
cd backend
npm install
JWT_SECRET='um-segredo-longo' ADMIN_EMAIL='voce@exemplo.com' ADMIN_SENHA='senha-forte' npm start
```

O servidor exige `JWT_SECRET`. Se `ADMIN_EMAIL` e `ADMIN_SENHA` estiverem definidos e esse e-mail ainda não existir, o administrador é criado na inicialização. Também dá para criar ou trocar a senha manualmente:

```bash
ADMIN_EMAIL='voce@exemplo.com' ADMIN_SENHA='nova-senha' npm run criar-admin
```

Frontend (em outro terminal):
```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `localhost:5173` e o backend em `localhost:3000`. O painel pede login com o e-mail e a senha do administrador.

## Variáveis de ambiente (backend)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `JWT_SECRET` | sim | Assina os tokens de login |
| `ADMIN_EMAIL`, `ADMIN_SENHA` | não | Cria o administrador inicial (senha com 8+ caracteres) |
| `CORS_ORIGIN` | não | Origens permitidas, separadas por vírgula. Sem ela, qualquer origem é aceita |
| `DB_PATH` | não | Caminho do arquivo SQLite (padrão: `agendamento.db`) |
| `PORT` | não | Porta do servidor (padrão: 3000) |

## Testes

```bash
cd backend
npm test
```

Cobrem conflito de horário (sobreposição parcial, horário adjacente, cancelamento liberando a vaga), validações e autenticação das rotas do painel.

## Estrutura

```
├── backend/     # API REST (Express + SQLite) e testes
├── frontend/    # Interface (React + Tailwind)
└── .github/     # CI (testes, lint e build)
```
