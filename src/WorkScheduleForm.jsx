import React, { useEffect, useState } from 'react';

export default function WorkScheduleForm({ schedule = {}, onSave }) {
  const [values, setValues] = useState(schedule);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setValues(schedule); }, [schedule.work_saturday, schedule.work_sunday, schedule.work_holidays]);

  async function save(event) {
    event.preventDefault();
    if (busy || !window.confirm('Salvar as preferências de dias de trabalho?')) return;
    setBusy(true);
    setMessage('');
    try {
      await onSave({
        work_saturday: Boolean(values.work_saturday),
        work_sunday: Boolean(values.work_sunday),
        work_holidays: Boolean(values.work_holidays),
      });
      setMessage('Dias de trabalho atualizados.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <form className="work-schedule-form" onSubmit={save}>
    <fieldset disabled={busy}>
      <legend>Dias de trabalho</legend>
      {[['work_saturday', 'Trabalha aos sábados?'], ['work_sunday', 'Trabalha aos domingos?'], ['work_holidays', 'Trabalha em feriados?']].map(([key, label]) =>
        <label key={key}><input type="checkbox" checked={Boolean(values[key])}
          onChange={event => setValues({ ...values, [key]: event.target.checked })}/><span>{label}</span></label>)}
    </fieldset>
    <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar dias de trabalho'}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
