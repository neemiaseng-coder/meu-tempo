import React, { useEffect, useRef, useState } from 'react';
import { Bell, Newspaper, X } from 'lucide-react';

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const toDate = date => new Date(date + 'T12:00:00Z');

export function upcomingReminders(events, date, occursOn) {
  return Array.from({ length: 7 }, (_, offset) => {
    const day = toDate(date);
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  }).flatMap(day => events.filter(event => event.event_type === 'other' && occursOn(event, day))
    .map(event => ({ event, day })));
}

export function AgendaSidebar({ events, date, occursOn, onReminder, children }) {
  const reminders = upcomingReminders(events, date, occursOn);
  return <aside className="agenda-sidebar" aria-label="Atualizações e lembretes">
    <section>
      <h2><Bell size={17}/> Lembretes dos próximos 7 dias</h2>
      {reminders.length ? <ul>{reminders.map(({ event, day }) => <li key={event.id + day}>
        <button onClick={() => onReminder(day, event)}>
          <time dateTime={day}>{shortDate.format(toDate(day))}</time><span>{event.description || event.title}</span>
        </button>
      </li>)}</ul> : <p>Nenhum lembrete neste período.</p>}
    </section>
    <section>
      <h2><Newspaper size={17}/> Notícias e atualizações</h2>
      {children ?? <p>O calendário agora permite incluir lembretes rápidos.</p>}
    </section>
  </aside>;
}

export function ReminderDialog({ reminder, onSave, onDelete, onClose }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = form.get('description').trim();
    if (!description) {
      setError('Escreva uma descrição.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(reminder.event?.id, form.get('date'), description);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Excluir este lembrete do calendário?')) return;
    setBusy(true);
    setError('');
    try {
      await onDelete(reminder.event.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return <dialog className="agenda-reminder-dialog" ref={dialog} aria-labelledby="agenda-reminder-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={save}>
      <header><h2 id="agenda-reminder-title">{reminder.event ? 'Editar lembrete' : 'Incluir lembrete'}</h2>
        <button type="button" className="secondary" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={17}/></button>
      </header>
      <label>Dia<input type="date" name="date" required defaultValue={reminder.event?.event_date ?? reminder.day} disabled={busy}/></label>
      <label>Descrição<textarea name="description" rows="3" required maxLength={500} disabled={busy}
        placeholder="Ex.: Aniversário da Ana" defaultValue={reminder.event?.description || reminder.event?.title || ''}/></label>
      {error && <p role="alert">{error}</p>}
      <footer>
        {reminder.event && <button className="secondary" type="button" disabled={busy} onClick={remove}>Excluir</button>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar lembrete'}</button>
      </footer>
    </form>
  </dialog>;
}
