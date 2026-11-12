import React from 'react';
import { CalendarCheck, CalendarDays, Check, ClipboardList, Plus } from 'lucide-react';

const tabs = [['Rotinas', CalendarCheck], ['Tarefas', ClipboardList], ['Reuniões', CalendarDays]];
const frequencies = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' };

export default function AnelisaWorkspace({ section, onSection, tasks, date, occursToday, isDone, toggle, onAdd, meetings, signOut }) {
  const current = tabs.some(([label]) => label === section) ? section : 'Rotinas';
  const routine = current === 'Rotinas';
  const list = tasks.filter(task => task.task_type === (routine ? 'routine' : 'demand')
    && task.is_active !== false && task.status !== 'cancelled');

  return <main className="anelisa-workspace">
    <header className="anelisa-header">
      <div><p className="eyebrow">Meu Tempo</p><h1>Olá, Anelisa</h1></div>
      <button className="secondary" onClick={signOut}>Sair</button>
    </header>
    <nav aria-label="Área da Anelisa" className="anelisa-nav">
      {tabs.map(([label, Icon]) => <button key={label} aria-current={current === label ? 'page' : undefined}
        className={current === label ? 'primary' : 'secondary'} onClick={() => onSection(label)}>
        <Icon size={19}/><span>{label}</span>
      </button>)}
    </nav>
    {current === 'Reuniões' ? meetings : <section className="task-panel">
      <div className="panel-head">
        <div><h2>{current}</h2><p className="muted">{routine ? 'Acompanhe as rotinas previstas para hoje.' : 'Acompanhe os prazos e as tarefas concluídas.'}</p></div>
        <button className="primary" onClick={() => onAdd(routine ? 'routine' : 'demand')}><Plus size={16}/>{routine ? 'Nova rotina' : 'Nova tarefa'}</button>
      </div>
      {!list.length && <div className="empty">{routine ? 'Nenhuma rotina cadastrada.' : 'Nenhuma tarefa cadastrada.'}</div>}
      {list.map(task => {
        const done = isDone(task);
        const scheduled = !routine || occursToday(task);
        const status = done ? 'Concluída' : routine ? scheduled ? 'Programada para hoje' : 'Fora da programação de hoje'
          : !task.due_date ? 'Sem prazo' : task.due_date < date ? 'Em atraso' : task.due_date === date ? 'Para hoje' : 'Agendada';
        return <div className="anelisa-task" key={task.id}>
          <button className={'myday-check' + (done ? ' checked' : '')} disabled={!scheduled}
            aria-pressed={done} aria-label={task.title} onClick={() => toggle(task)}>{done && <Check size={16}/>}</button>
          <div><strong>{task.title}</strong><small>{routine ? frequencies[task.recurrence_type] : task.due_date &&
            new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</small></div>
          <span>{status}</span>
        </div>;
      })}
    </section>}
  </main>;
}
