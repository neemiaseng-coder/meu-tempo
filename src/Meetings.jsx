import React, { useState } from 'react';
import { CalendarDays, Check, Plus, Sparkles } from 'lucide-react';

const formatDate = date => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR');
const newDraft = date => ({ meeting_date: date, title: '', agenda: '', participants: '', discussion_notes: '' });

export default function Meetings({ client, userId, today, meetings, tasks, onMeeting, onTask, initialMeetingId, mode, canManage = false, onDeleteMeeting }) {
  const [draft, setDraft] = useState(() => mode === 'start' ? newDraft(today) : null);
  const [open, setOpen] = useState(initialMeetingId ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const selected = meetings.find(meeting => meeting.id === open);
  const visibleMeetings = mode === 'history' ? meetings.filter(meeting => meeting.finalized_at)
    : mode === 'start' ? meetings.filter(meeting => !meeting.finalized_at)
    : mode === 'detail' ? [] : meetings;
  const heading = mode === 'history' ? 'Reuniões realizadas' : mode === 'start' ? 'Iniciar reunião' : 'Reuniões';

  function edit(meeting) {
    setError('');
    setOpen(meeting?.id ?? null);
    setDraft(meeting ? { ...meeting } : newDraft(today));
  }

  async function save(event) {
    event.preventDefault();
    const finalize = event.nativeEvent.submitter?.value === 'finalize';
    if (pending) return;
    const { title, meeting_date, agenda, participants, discussion_notes } = draft;
    if (!title.trim() || (finalize && !discussion_notes.trim())) {
      setError('Preencha o título e, para finalizar, escreva o rascunho da reunião.');
      return;
    }
    if (canManage && draft.id && !window.confirm('Salvar as alterações nesta reunião?')) return;
    setPending(true);
    setError('');
    try {
      const values = { title: title.trim(), meeting_date, agenda, participants, discussion_notes };
      if (canManage && draft.finalized_at) {
        values.organized_notes = draft.organized_notes;
        values.action_items = draft.action_items;
      }
      const table = client.from('meetings');
      let write = draft.id
        ? table.update(values).eq('id', draft.id).eq('user_id', userId)
        : table.insert({ ...values, user_id: userId });
      if (draft.id && !canManage) write = write.is('finalized_at', null);
      const { data, error } = await write.select().single();
      if (error) throw error;
      setDraft(data);
      setOpen(data.id);
      onMeeting(data);
      if (finalize) {
        const result = await client.functions.invoke('organize-meeting', { body: { id: data.id } });
        if (result.error) {
          const details = await result.error.context?.json?.().catch(() => null);
          throw new Error(details?.error || 'A IA está indisponível. Seu rascunho foi salvo.');
        }
        onMeeting(result.data);
      }
      setDraft(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  async function schedule(event, action) {
    event.preventDefault();
    if (pending) return;
    const date = new FormData(event.currentTarget).get('date');
    if (!date) return;
    if (canManage && tasks.some(task => task.id === action.id) && !window.confirm('Alterar o prazo desta tarefa?')) return;
    setPending(true);
    setError('');
    try {
      const existing = tasks.find(task => task.id === action.id);
      const table = client.from('tasks');
      const dates = { due_date: date, scheduled_date: date };
      const write = existing
        ? table.update(dates).eq('id', action.id).eq('user_id', userId)
        : table.upsert({ ...dates, id: action.id, user_id: userId, title: action.title,
            description: [action.details, 'Reunião: ' + selected.title].filter(Boolean).join('\n') },
            { onConflict: 'id' });
      const { data, error } = await write.select().single();
      if (error) throw error;
      onTask(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  async function remove(meeting) {
    if (pending || !window.confirm('Excluir a reunião “' + meeting.title + '”? As tarefas já criadas continuam na agenda.')) return;
    setPending(true);
    setError('');
    try {
      await onDeleteMeeting(meeting.id);
      setDraft(null);
      setOpen(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return <section className="task-panel meeting-workspace">
    <div className="panel-head">
      <div><h2>{heading}</h2>{!mode && <p className="muted">Anote o alinhamento e acompanhe as tarefas combinadas.</p>}</div>
      {(!mode || mode === 'start') && !draft && <button className="primary" disabled={pending} onClick={() => edit()}><Plus size={17}/> Nova reunião</button>}
    </div>
    {error && <p className="meeting-error" role="alert">{error}</p>}
    {draft && <form className="meeting-editor" onSubmit={save}>
      <h3>{draft.finalized_at ? 'Editar reunião realizada' : 'Rascunho da reunião'}</h3>
      <fieldset disabled={pending}>
        <div className="form-grid">
          <label>Título<input required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
          <label>Data<input required type="date" value={draft.meeting_date} onChange={e => setDraft({ ...draft, meeting_date: e.target.value })}/></label>
          <label>Participantes<input value={draft.participants} onChange={e => setDraft({ ...draft, participants: e.target.value })}/></label>
          <label>Pauta<input value={draft.agenda} onChange={e => setDraft({ ...draft, agenda: e.target.value })}/></label>
        </div>
        <label>Anotações<textarea rows={10} maxLength={24000} value={draft.discussion_notes}
          onChange={e => setDraft({ ...draft, discussion_notes: e.target.value })} placeholder="Digite os assuntos, decisões e tarefas durante a reunião…"/></label>
        {canManage && draft.finalized_at && <>
          {(draft.organized_notes || []).map((topic, index) => <div key={index}>
            <label>Assunto<input value={topic.title} onChange={event => setDraft({
              ...draft, organized_notes: draft.organized_notes.map((item, i) => i === index ? { ...item, title: event.target.value } : item),
            })}/></label>
            <label>Tópicos, um por linha<textarea rows={4} value={topic.points.join('\n')} onChange={event => setDraft({
              ...draft, organized_notes: draft.organized_notes.map((item, i) => i === index ? { ...item, points: event.target.value.split('\n') } : item),
            })}/></label>
          </div>)}
        </>}
        <div className="meeting-buttons">
          <button className="secondary" type="button" onClick={() => {
            if (window.confirm('Fechar o rascunho? As alterações desde o último salvamento serão descartadas.')) setDraft(null);
          }}>Fechar</button>
          <button className="secondary" type="submit" value="draft">{draft.finalized_at ? 'Salvar alterações' : 'Salvar rascunho'}</button>
          {!draft.finalized_at && <button className="primary" type="submit" value="finalize"><Sparkles size={16}/> Finalizar alinhamento</button>}
        </div>
      </fieldset>
      {pending && <p role="status">Processando reunião…</p>}
    </form>}
    {!draft && selected && <article className="meeting-editor">
      <span className="meeting-date">{formatDate(selected.meeting_date)}</span>
      <h3>{selected.title}</h3>
      {canManage && <div className="entry-actions">
        <button className="secondary" disabled={pending} onClick={() => edit(selected)}>Editar reunião</button>
        <button className="secondary" disabled={pending} onClick={() => remove(selected)}>Excluir reunião</button>
      </div>}
      {selected.participants && <p><b>Participantes</b> · {selected.participants}</p>}
      {selected.agenda && <p><b>Pauta</b> · {selected.agenda}</p>}
      {selected.finalized_at ? <>
        {(selected.organized_notes || []).map((topic, index) => <div key={index}>
          <h4>{topic.title}</h4><ul>{topic.points.map((point, i) => <li key={i}>{point}</li>)}</ul>
        </div>)}
        <h4>Tarefas da reunião</h4>
        {!selected.action_items?.length && <p className="muted">Nenhuma tarefa identificada.</p>}
        {(selected.action_items || []).map(action => {
          const task = tasks.find(item => item.id === action.id);
          return <form className="meeting-action" key={action.id} onSubmit={e => schedule(e, action)}>
            <div><strong>{action.title}</strong>{action.details && <p>{action.details}</p>}
              {task?.due_date && <small><Check size={14}/> Em Tarefas para {formatDate(task.due_date)}</small>}
            </div>
            <label>Prazo<input name="date" type="date" required defaultValue={task?.due_date ?? ''}/></label>
            <button className="secondary" disabled={pending}>{task ? 'Atualizar prazo' : 'Adicionar à agenda'}</button>
          </form>;
        })}
        <details><summary>Rascunho original</summary><p className="meeting-notes">{selected.discussion_notes}</p></details>
      </> : <>
        <p className="meeting-notes">{selected.discussion_notes}</p>
        <button className="secondary" onClick={() => edit(selected)}>Continuar rascunho</button>
      </>}
    </article>}
    {!visibleMeetings.length && !draft && !selected && <div className="empty">
      {mode === 'history' ? 'Nenhuma reunião realizada.' : mode === 'start' ? 'Nenhum rascunho salvo.' : 'Nenhuma reunião cadastrada.'}
    </div>}
    <div className="meeting-history">
      {visibleMeetings.map(meeting => <button type="button" key={meeting.id} className="meeting-list-item"
        aria-pressed={open === meeting.id} disabled={pending || Boolean(draft)}
        onClick={() => { setOpen(meeting.id); setError(''); }}>
        <CalendarDays size={19}/><span><strong>{meeting.title}</strong><small>{formatDate(meeting.meeting_date)}</small></span>
        <small>{meeting.finalized_at ? 'Finalizada' : 'Rascunho'}</small>
      </button>)}
    </div>
  </section>;
}
