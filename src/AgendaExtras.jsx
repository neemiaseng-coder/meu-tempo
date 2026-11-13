import React, { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Newspaper, X } from 'lucide-react';

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

export function MiniCalendar({ today, selected, holidaysForMonth, onSelect, hasEvent }) {
  const [month, setMonth] = useState(() => new Date(today + 'T12:00:00'));
  const year = month.getFullYear();
  const index = month.getMonth();
  const first = new Date(year, index, 1).getDay();
  const days = new Date(year, index + 1, 0).getDate();
  const holidays = holidaysForMonth(year, index);
  const heading = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });

  return <section className="neemias-mini-calendar" aria-label="Calendário rápido">
    <h2><CalendarDays size={17}/> Calendário</h2>
    <div className="mini-calendar-toolbar">
      <button aria-label="Mês anterior" onClick={() => setMonth(new Date(year, index - 1, 1))}><ChevronLeft size={16}/></button>
      <span aria-live="polite">{heading}</span>
      <button aria-label="Próximo mês" onClick={() => setMonth(new Date(year, index + 1, 1))}><ChevronRight size={16}/></button>
    </div>
    <div className="mini-calendar-grid">
      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => <span key={'weekday-' + i} aria-hidden="true">{day}</span>)}
      {Array.from({ length: first }, (_, i) => <span key={'blank-' + i}/>)}
      {Array.from({ length: days }, (_, i) => {
        const day = new Date(year, index, i + 1, 12);
        const iso = day.toLocaleDateString('en-CA');
        const holiday = holidays[iso];
        return <button key={iso} aria-label={dateLabel.format(day) + (holiday ? ', ' + holiday : '') + (hasEvent?.(iso) ? ', com evento' : '')}
          title={holiday} aria-current={iso === today ? 'date' : undefined} aria-pressed={iso === selected}
          data-holiday={holiday ? true : undefined} data-weekend={[0, 6].includes(day.getDay()) ? true : undefined}
          onClick={() => onSelect(iso)}>{i + 1}{hasEvent?.(iso) && <span className="aw-mini-dot" aria-hidden="true"/>}</button>;
      })}
    </div>
  </section>;
}

export function AgendaSidebar({ events, date, occursOn, onReminder, calendar, children }) {
  const reminders = upcomingReminders(events, date, occursOn);
  return <aside className="agenda-sidebar" aria-label="Calendário, atualizações e lembretes">
    {calendar}
    <section className="agenda-sidebar-reminders">
      <h2><Bell size={17}/> Lembretes dos próximos 7 dias</h2>
      {reminders.length ? <ul>{reminders.map(({ event, day }) => <li key={event.id + day}>
        <button onClick={() => onReminder(day, event)}>
          <time dateTime={day}>{shortDate.format(toDate(day))}</time><span>{event.description || event.title}</span>
        </button>
      </li>)}</ul> : <p>Nenhum lembrete neste período.</p>}
    </section>
    <section className="agenda-sidebar-news">
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
        placeholder="Ex.: Aniversário da Ana" defaultValue={reminder.event?.description || reminder.event?.title || reminder.initialDescription || ''}/></label>
      {error && <p role="alert">{error}</p>}
      <footer>
        {reminder.event && <button className="secondary" type="button" disabled={busy} onClick={remove}>Excluir</button>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar lembrete'}</button>
      </footer>
    </form>
  </dialog>;
}
