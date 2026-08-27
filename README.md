# União Barbearia — Sistema de Agendamento

Aplicação full-stack de agendamento online para barbearias, com painel administrativo e checagem automática de conflito de horários.

🔗 **Demo:** https://frontend-one-phi-61.vercel.app/
🔗 **API:** https://barbearia-full-stack.onrender.com

## Funcionalidades

- Agendamento de horário com seleção de serviço, data e hora
- Validação automática de conflitos de horário no backend
- Painel administrativo com listagem e cancelamento de agendamentos
- Cadastro de clientes e serviços via API REST

## Stack

**Frontend:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express
**Banco de dados:** SQLite (better-sqlite3)
**Deploy:** Vercel (frontend) + Render (backend)

## Rodando localmente

Backend:
```bash
cd backend
npm install
node server.js
```

Frontend (em outro terminal):
```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `localhost:5173` e o backend em `localhost:3000`.

## Estrutura

```
agendamento-app/
├── backend/     # API REST (Express + SQLite)
└── frontend/    # Interface (React + Tailwind)
```
