import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ActivityEditor({ task, date, onSave, onClose }) {
  const routine = task.task_type === 'routine';
  const [frequency, setFrequency] = useState(task.recurrence_type || 'daily');
  const [days, setDays] = useState(task.recurrence_days || []);
  const [flexible, setFlexible] = useState(task.recurrence_type === 'monthly' && !days.length);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const variableMonth = routine && frequency === 'monthly' && flexible;

  useEffect(() => { dialog.current.showModal(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const title = form.get('title').trim();
    if (!title || (routine && frequency === 'weekly' && !days.length)) {
      setError(title ? 'Selecione pelo menos um dia da semana.' : 'Informe o título.');
      return;
    }
    const day = form.get('date') || null;
    setSaving(true);
    setError('');
    try {
      await onSave(task.id, {
        title, description: form.get('description').trim() || null, task_type: task.task_type,
        due_date: variableMonth ? null : day,
        scheduled_date: day,
        recurrence_type: routine ? frequency : 'none',
        recurrence_days: !routine ? [] : frequency === 'weekly' ? days :
          frequency === 'monthly' && !flexible ? [Number(form.get('month-day'))] : [],
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return <dialog className="aw-activity-dialog" ref={dialog} aria-labelledby="aw-activity-title"
    onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
    onClick={event => { if (!saving && event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={submit}>
      <div className="aw-profile-heading">
        <h2 id="aw-activity-title">{task.id ? 'Editar' : 'Criar'} {routine ? 'rotina' : 'tarefa'}</h2>
        <button className="secondary" aria-label="Fechar" type="button" disabled={saving} onClick={onClose}><X size={18}/></button>
      </div>
      <fieldset disabled={saving}>
        <label>Título<input name="title" defaultValue={task.title ?? ''} required autoFocus/></label>
        <label>Descrição<textarea name="description" rows="2" defaultValue={task.description ?? ''}/></label>
        {routine && <label>Periodicidade<select value={frequency} onChange={event => setFrequency(event.target.value)}>
          <option value="daily">Todos os dias</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select></label>}
        {routine && frequency === 'weekly' && <fieldset className="aw-weekdays">
          <legend>Dias da semana</legend>
          {weekdays.map((name, index) => <label key={name}>
            <input type="checkbox" checked={days.includes(index)}
              onChange={event => setDays(event.target.checked ? [...days, index] : days.filter(day => day !== index))}/>
            {name}
          </label>)}
        </fieldset>}
        {routine && frequency === 'monthly' && <>
          <label>Agendamento<select value={flexible ? 'variable' : 'fixed'} onChange={event => setFlexible(event.target.value === 'variable')}>
            <option value="fixed">Dia fixo</option>
            <option value="variable">Data variável</option>
          </select></label>
          {!flexible && <label>Dia do mês<input name="month-day" type="number" min="1" max="31" required defaultValue={task.recurrence_days?.[0] || 1}/></label>}
        </>}
        <label>{variableMonth ? 'Próxima data (opcional)' : routine ? 'Data de início' : 'Data da tarefa'}
          <input key={variableMonth ? 'variable' : 'fixed'} name="date" type="date" required={!variableMonth}
            defaultValue={variableMonth ? task.scheduled_date ?? '' : task.due_date ?? date}/>
        </label>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
    </form>
  </dialog>;
}
