
import { useState, useEffect } from 'react'
import { API_URL } from './config'

function App() {
  const [view, setView] = useState('agendar')
  const [servicos, setServicos] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', servico_id: '', data: '', hora: '' })
  const [mensagem, setMensagem] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/servicos`)
      .then(r => r.json())
      .then(setServicos)
      .catch(() => setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar os serviços.' }))
  }, [])

  useEffect(() => {
    if (view === 'painel') buscarAgendamentos()
  }, [view])

  function buscarAgendamentos() {
    fetch(`${API_URL}/agendamentos`)
      .then(r => r.json())
      .then(setAgendamentos)
      .catch(() => setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar os agendamentos.' }))
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMensagem(null)
    setCarregando(true)

    try {
      const clienteRes = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome, telefone: form.telefone, email: form.email || null }),
      })
      const cliente = await clienteRes.json()
      if (!clienteRes.ok) throw new Error(cliente.erro || 'Erro ao criar cliente')

      const data_hora = `${form.data} ${form.hora}:00`

      const agendamentoRes = await fetch(`${API_URL}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: cliente.id, servico_id: Number(form.servico_id), data_hora }),
      })
      const agendamento = await agendamentoRes.json()
      if (!agendamentoRes.ok) throw new Error(agendamento.erro || 'Erro ao criar agendamento')

      setMensagem({ tipo: 'sucesso', texto: 'Agendamento confirmado!' })
      setForm({ nome: '', telefone: '', email: '', servico_id: '', data: '', hora: '' })
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setCarregando(false)
    }
  }

  async function cancelar(id) {
    await fetch(`${API_URL}/agendamentos/${id}/cancelar`, { method: 'PATCH' })
    buscarAgendamentos()
  }

  return (
    <div className="min-h-screen bg-ivory">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-6 py-6">
        <span className="font-display text-3xl tracking-wide text-charcoal">UNIÃO BARBEARIA</span>
        <nav className="flex gap-2 font-mono text-xs uppercase tracking-widest">
          <button
            onClick={() => setView('agendar')}
            className={`px-4 py-2 rounded-full transition-colors ${view === 'agendar' ? 'bg-charcoal text-ivory' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Agendar
          </button>
          <button
            onClick={() => setView('painel')}
            className={`px-4 py-2 rounded-full transition-colors ${view === 'painel' ? 'bg-charcoal text-ivory' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Painel
          </button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        {mensagem && (
          <div className={`mb-6 px-5 py-3 rounded-xl font-body text-sm ${mensagem.tipo === 'sucesso' ? 'bg-amber/20 text-charcoal border border-amber' : 'bg-rust/10 text-rust border border-rust/40'}`}>
            {mensagem.texto}
          </div>
        )}

        {view === 'agendar' && (
          <form onSubmit={handleSubmit} className="bg-charcoal text-ivory rounded-[28px] p-8 md:p-10 max-w-xl">
            <h1 className="font-display text-4xl mb-8">Marcar horário</h1>

            <div className="grid gap-5">
              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-amber-light">Nome</label>
                <input
                  name="nome" value={form.nome} onChange={handleChange} required
                  className="w-full mt-1.5 bg-charcoal-light border border-ivory/15 rounded-lg px-4 py-2.5 outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-amber-light">Telefone</label>
                <input
                  name="telefone" value={form.telefone} onChange={handleChange} required
                  className="w-full mt-1.5 bg-charcoal-light border border-ivory/15 rounded-lg px-4 py-2.5 outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-amber-light">E-mail (opcional)</label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  className="w-full mt-1.5 bg-charcoal-light border border-ivory/15 rounded-lg px-4 py-2.5 outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-amber-light">Serviço</label>
                <select
                  name="servico_id" value={form.servico_id} onChange={handleChange} required
                  className="w-full mt-1.5 bg-charcoal-light border border-ivory/15 rounded-lg px-4 py-2.5 outline-none focus:border-amber"
                >
                  <option value="">Selecione</option>
                  {servicos.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} — R$ {s.preco.toFixed(2)} ({s.duracao_min}min)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-amber-light">Data</label>
                  <input
                    name="data" type="date" value={form.data} onChange={handleChange} required
                    className="w-full mt-1.5 bg-charcoal-light border border-ivory/15 rounded-lg px-4 py-2.5 outline-none focus:border-amber"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-amber-light">Hora</label>
                  <input
                    name="hora" type="time" value={form.hora} onChange={handleChange} required
                    className="w-full mt-1.5 bg-charcoal-light border border-ivory/15 rounded-lg px-4 py-2.5 outline-none focus:border-amber"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={carregando}
              className="mt-8 w-full bg-amber text-charcoal font-semibold py-3.5 rounded-full hover:bg-amber-light transition-colors disabled:opacity-50"
            >
              {carregando ? 'Enviando...' : 'Confirmar agendamento'}
            </button>
          </form>
        )}

        {view === 'painel' && (
          <div>
            <h1 className="font-display text-4xl text-charcoal mb-8">Painel de agendamentos</h1>
            <div className="grid gap-4">
              {agendamentos.length === 0 && (
                <p className="text-charcoal/50 font-body">Nenhum agendamento ainda.</p>
              )}
              {agendamentos.map(a => (
                <div key={a.id} className="bg-white border border-charcoal/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-xl text-charcoal">{a.cliente_nome}</p>
                    <p className="font-mono text-xs text-charcoal/50 mt-1">{a.cliente_telefone}</p>
                  </div>
                  <div>
                    <p className="font-body text-sm text-charcoal">{a.servico_nome}</p>
                    <p className="font-mono text-xs text-charcoal/50 mt-1">{a.data_hora}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full ${a.status === 'confirmado' ? 'bg-amber/20 text-charcoal' : 'bg-rust/10 text-rust'}`}>
                      {a.status}
                    </span>
                    {a.status === 'confirmado' && (
                      <button
                        onClick={() => cancelar(a.id)}
                        className="font-mono text-xs uppercase tracking-widest text-rust hover:underline"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App