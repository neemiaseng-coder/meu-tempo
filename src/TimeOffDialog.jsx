import React, { useEffect, useRef, useState } from 'react';
import { CalendarX2, X } from 'lucide-react';

const formatDate = value => new Date(value + 'T12:00:00').toLocaleDateString('pt-BR');

export default function TimeOffDialog({ events, today, onSave, onDelete, onClose }) {
  const dialog = useRef(null);
  const [editing, setEditing] = useState(null);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);

  function select(event) {
    setEditing(event);
    setStart(event?.event_date || today);
    setEnd(event?.end_date || event?.event_date || today);
    setTitle(event?.title || '');
    setError('');
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (end && end < start) { setError('A data final deve ser igual ou posterior à inicial.'); return; }
    if (editing && !window.confirm('Salvar as alterações neste período sem expediente?')) return;
    setBusy(true);
    setError('');
    try {
      await onSave(editing, { event_date: start, end_date: end || start, title: title.trim() || 'Sem expediente', description: title.trim() });
      select(null);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <dialog className="entry-editor" ref={dialog} aria-labelledby="time-off-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={save}>
      <header><h2 id="time-off-title"><CalendarX2 size={20}/> Sem expediente</h2>
        <button type="button" className="secondary" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={18}/></button>
      </header>
      <fieldset disabled={busy}>
        <label>Motivo (opcional)<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Férias, folga, compromisso pessoal"/></label>
        <div className="form-grid">
          <label>Data inicial<input required type="date" value={start} onChange={event => {
            const value=event.target.value;
            setStart(value);
            if (!end || end < value) setEnd(value);
          }}/></label>
          <label>Data final<input type="date" min={start} value={end} onChange={event => setEnd(event.target.value)}/></label>
        </div>
        <p>Para um único dia, use a mesma data no início e no fim.</p>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <footer>
        {editing && <button type="button" className="secondary" disabled={busy} onClick={async () => {
          if (!window.confirm('Excluir este período sem expediente?')) return;
          setBusy(true);
          setError('');
          try { await onDelete(editing.id); select(null); } catch (err) { setError(err.message); }
          finally { setBusy(false); }
        }}>Excluir período</button>}
        {editing && <button type="button" className="secondary" disabled={busy} onClick={() => select(null)}>Novo período</button>}
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : editing ? 'Salvar alteração' : 'Incluir período'}</button>
      </footer>
      <div className="time-off-list">
        <h3>Períodos cadastrados</h3>
        {events.length ? [...events].sort((a, b) => b.event_date.localeCompare(a.event_date)).map(event =>
          <button type="button" className="secondary" key={event.id} disabled={busy} onClick={() => select(event)}>
            <span>{event.title}<small>{formatDate(event.event_date)} a {formatDate(event.end_date || event.event_date)}</small></span>
          </button>) : <p>Nenhum período cadastrado.</p>}
      </div>
    </form>
  </dialog>;
}
