import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { occursOn, recurrenceLabels, weekdays } from './recurrence.js';

const formatMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Household({ client, userId, date, shopping }) {
  const [type, setType] = useState(shopping ? 'purchase' : 'routine');
  const [frequency, setFrequency] = useState('daily');
  const [entries, setEntries] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [items, checks] = await Promise.all([
      client.from('household_items').select('*').in('kind', shopping ? ['purchase'] : ['routine', 'task'])
        .order('created_at', { ascending: false }),
      shopping ? { data: [] } : client.from('household_checks').select('item_id').eq('occurrence_date', date),
    ]);
    if (items.error || checks.error) throw items.error || checks.error;
    return [items.data, checks.data.map(check => check.item_id)];
  }

  useEffect(() => {
    let active = true;
    load().then(([items, checks]) => {
      if (!active) return;
      setEntries(items);
      setCompletions(checks);
    }).catch(err => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [client, userId, date, shopping]);

  async function add(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = values.get('title').trim();
    if (!title || saving) return;
    const weekly = type === 'routine' && ['weekly', 'biweekly'].includes(frequency);
    const days = weekly ? values.getAll('day').map(Number) : frequency === 'monthly' && type === 'routine'
      ? [Number(values.get('monthDay'))] : [];
    if (weekly && !days.length) {
      setError('Selecione pelo menos um dia da semana.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await client.from('household_items').insert({
        created_by: userId, kind: type, title,
        description: values.get('description').trim(),
        estimated_price: shopping && values.get('price') !== '' ? Number(values.get('price')) : null,
        starts_on: type === 'routine' ? values.get('start') : null,
        recurrence: type === 'routine' ? frequency : null,
        recurrence_days: days,
      }).select().single();
      if (result.error) throw result.error;
      setEntries(old => [result.data, ...old]);
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item, done) {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      if (item.kind === 'routine') {
        const result = done
          ? await client.from('household_checks').delete().eq('item_id', item.id).eq('occurrence_date', date)
          : await client.from('household_checks').upsert({ item_id: item.id, occurrence_date: date },
              { onConflict: 'item_id,occurrence_date', ignoreDuplicates: true });
        if (result.error) throw result.error;
        setCompletions(old => done ? old.filter(id => id !== item.id) : [...old, item.id]);
      } else {
        const result = await client.from('household_items').update({ done: !done }).eq('id', item.id).select().single();
        if (result.error) throw result.error;
        setEntries(old => old.map(entry => entry.id === item.id ? result.data : entry));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return <section className="task-panel household">
    <div className="panel-head">
      <div>
        <h2>{shopping ? 'Compras da casa' : 'Checklist da casa'}</h2>
        <p className="muted">Compartilhado entre Neemias e Anelisa</p>
      </div>
      {!shopping && <div className="module-nav">
        <button className={type === 'routine' ? 'primary' : 'secondary'} onClick={() => setType('routine')}>Rotinas</button>
        <button className={type === 'task' ? 'primary' : 'secondary'} onClick={() => setType('task')}>Tarefas</button>
      </div>}
    </div>
    {error && <p role="alert">{error}</p>}
    <form className="household-form" onSubmit={add} key={type}>
      <label>{shopping ? 'Item' : 'Título'}<input name="title" required placeholder={shopping ? 'Lâmpada para o corredor' : undefined}/></label>
      <label>Descrição<textarea name="description" rows={2}/></label>
      {shopping && <label>Valor estimado (R$)<input name="price" type="number" min="0" max="99999999.99" step="0.01"/></label>}
      {type === 'routine' && <>
        <label>Data de início<input name="start" type="date" defaultValue={date} required/></label>
        <label>Periodicidade<select value={frequency} onChange={event => setFrequency(event.target.value)}>
          {Object.entries(recurrenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        {['weekly', 'biweekly'].includes(frequency) && <fieldset className="weekday-picker">
          <legend>Dias da semana</legend><div>{weekdays.map(([name, value]) =>
            <label key={value} className="weekday"><input name="day" type="checkbox" value={value}/>{name}</label>)}</div>
        </fieldset>}
        {frequency === 'monthly' && <label>Dia do mês<input name="monthDay" type="number" min="1" max="31" defaultValue="10" required/></label>}
      </>}
      <button className="primary" disabled={loading || saving}><Plus size={16}/> Adicionar</button>
    </form>
    {loading && <p role="status">Carregando lista…</p>}
    <ul className="household-list">
      {entries.filter(item => item.kind === type).map(item => {
        const scheduled = occursOn({
          task_type: item.kind, due_date: item.starts_on,
          recurrence_type: item.recurrence, recurrence_days: item.recurrence_days,
        }, date);
        const done = item.kind === 'routine' ? completions.includes(item.id) : item.done;
        return <li key={item.id}>
          <input type="checkbox" aria-label={item.title} checked={done}
            disabled={saving || (item.kind === 'routine' && !scheduled)} onChange={() => toggle(item, done)}/>
          <div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}
            {item.kind === 'routine' && <small>{recurrenceLabels[item.recurrence]} · {scheduled ? 'Programada para hoje' : 'Fora da programação de hoje'}</small>}
          </div>
          {item.estimated_price != null && <span>{formatMoney.format(item.estimated_price)}</span>}
        </li>;
      })}
    </ul>
  </section>;
}
