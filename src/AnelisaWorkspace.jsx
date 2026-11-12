import React, { useRef, useState } from 'react';
import { CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList,
  House, List, LogOut, Plus, Settings, X } from 'lucide-react';
import './anelisa.css';

const tabs = [['Home', House], ['Tarefas', ClipboardList], ['Rotinas', CalendarCheck], ['Reuniões', CalendarDays]];
const frequencies = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' };
const fullDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const toDate = value => new Date(value + 'T12:00:00');
const isoDate = date => date.toLocaleDateString('en-CA');
const isRoutine = task => task.task_type === 'routine';

export function routineOccurs(task, date) {
  if (!isRoutine(task) || task.is_active === false || task.status === 'cancelled'
    || (task.due_date && task.due_date > date) || (task.recurrence_end && task.recurrence_end < date)) return false;
  const day = toDate(date);
  const schedule = task.recurrence_days ?? [];
  return task.recurrence_type === 'daily'
    || (task.recurrence_type === 'weekly' && schedule.includes(day.getDay()))
    || (task.recurrence_type === 'monthly' && schedule.includes(day.getDate()));
}

function TaskRows({ tasks, date, isDone, toggle }) {
  if (!tasks.length) return <p className="aw-empty">Nenhuma atividade nesta lista.</p>;
  return tasks.map(task => {
    const routine = isRoutine(task);
    const scheduled = !routine || routineOccurs(task, date);
    const done = isDone(task);
    const status = done ? 'Concluída' : routine ? scheduled ? 'Hoje' : 'Fora da programação de hoje'
      : !task.due_date ? 'Sem prazo' : task.due_date < date ? 'Em atraso' : task.due_date === date ? 'Hoje' : 'Agendada';
    return <div className="anelisa-task" key={task.id}>
      <button className={'myday-check' + (done ? ' checked' : '')} disabled={!scheduled}
        aria-pressed={done} aria-label={task.title} onClick={() => toggle(task)}>{done && <Check size={16}/>}</button>
      <div><strong>{task.title}</strong><small>{routine ? frequencies[task.recurrence_type] : task.due_date &&
        toDate(task.due_date).toLocaleDateString('pt-BR')}</small></div>
      <span className={status === 'Em atraso' ? 'aw-late' : undefined}>{status}</span>
    </div>;
  });
}

function AgendaCalendar({ date, tasks, meetings, onMeeting }) {
  const [selected, setSelected] = useState(date);
  const [month, setMonth] = useState(() => new Date(toDate(date).getFullYear(), toDate(date).getMonth(), 1, 12));
  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const days = new Date(year, monthNumber + 1, 0).getDate();

  function entries(day) {
    return [
      ...tasks.filter(task => isRoutine(task) ? routineOccurs(task, day) : task.due_date === day)
        .map(task => ({ ...task, kind: isRoutine(task) ? 'Rotina' : 'Tarefa' })),
      ...meetings.filter(meeting => meeting.meeting_date === day).map(meeting => ({ ...meeting, kind: 'Reunião' })),
    ];
  }

  function navigate(offset) {
    const next = new Date(year, monthNumber + offset, 1, 12);
    setMonth(next);
    setSelected(isoDate(next));
  }

  const agenda = entries(selected);
  return <section className="task-panel aw-calendar" aria-label="Calendário">
    <div className="aw-calendar-heading">
      <h2>{monthLabel.format(month)}</h2>
      <div>
        <button className="secondary" aria-label="Mês anterior" onClick={() => navigate(-1)}><ChevronLeft size={18}/></button>
        <button className="secondary" aria-label="Próximo mês" onClick={() => navigate(1)}><ChevronRight size={18}/></button>
      </div>
    </div>
    <div className="aw-calendar-grid">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <small key={day}>{day}</small>)}
      {Array.from({ length: month.getDay() }, (_, i) => <span key={'blank-' + i}/>)}
      {Array.from({ length: days }, (_, index) => {
        const day = new Date(year, monthNumber, index + 1, 12);
        const value = isoDate(day);
        const count = entries(value).length;
        return <button key={value} className="aw-day" aria-pressed={selected === value}
          aria-current={date === value ? 'date' : undefined}
          aria-label={fullDate.format(day) + (count ? ', ' + count + (count === 1 ? ' item' : ' itens') : '')}
          onClick={() => setSelected(value)}>
          {index + 1}{count > 0 && <span className="aw-day-dot"/>}
        </button>;
      })}
    </div>
    <div className="aw-agenda">
      <h3>{fullDate.format(toDate(selected))}</h3>
      {agenda.length ? <ul>{agenda.map(item => <li key={item.kind + item.id}>
        <span>{item.kind}</span>
        {item.kind === 'Reunião' ? <button onClick={() => onMeeting(item.id)}>{item.title}</button> : <strong>{item.title}</strong>}
      </li>)}</ul> : <p className="aw-empty">Nenhum item para este dia.</p>}
    </div>
  </section>;
}

export default function AnelisaWorkspace({ section, onSection, tasks, date, isDone, toggle, onAdd,
  meetings, renderMeetings, signOut, userId, email }) {
  const current = tabs.some(([label]) => label === section) ? section : 'Home';
  const [view, setView] = useState('list');
  const [openedMeeting, setOpenedMeeting] = useState(null);
  const [photo, setPhoto] = useState(() => localStorage.getItem('meu-tempo-photo-' + userId) || '');
  const [photoError, setPhotoError] = useState('');
  const menu = useRef(null);
  const active = tasks.filter(task => task.is_active !== false && task.status !== 'cancelled');
  const routines = active.filter(task => routineOccurs(task, date));
  const due = active.filter(task => !isRoutine(task) && task.due_date &&
    (task.due_date === date || (task.due_date < date && !isDone(task))));
  const todaysMeetings = meetings.filter(meeting => meeting.meeting_date === date);
  const list = active.filter(task => current === 'Rotinas' ? isRoutine(task) : !isRoutine(task));
  const calendarTasks = current === 'Home' ? active : current === 'Reuniões' ? [] : list;

  function go(label) {
    onSection(label);
    setOpenedMeeting(null);
  }

  function changePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1_500_000) {
      setPhotoError('Escolha uma imagem JPG, PNG ou WebP de até 1,5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem('meu-tempo-photo-' + userId, reader.result);
        setPhoto(reader.result);
        setPhotoError('');
      } catch {
        setPhotoError('Não foi possível salvar a foto neste navegador.');
      }
    };
    reader.readAsDataURL(file);
  }

  return <main className="anelisa-workspace">
    <header className="aw-header">
      <button className="aw-brand" onClick={() => go('Home')}><House size={18}/> Meu Tempo</button>
      <nav aria-label="Módulos" className="aw-nav">
        {tabs.map(([label, Icon]) => <button key={label} aria-current={current === label ? 'page' : undefined}
          onClick={() => go(label)}><Icon size={21}/><span>{label}</span></button>)}
      </nav>
      <button className="aw-avatar" aria-label="Abrir configurações do perfil" aria-haspopup="dialog"
        onClick={() => menu.current.showModal()}>{photo ? <img src={photo} alt=""/> : 'A'}</button>
    </header>

    <div className="aw-heading">
      <div><p>{fullDate.format(toDate(date))}</p><h1>{current === 'Home' ? 'Olá, Anelisa' : current}</h1></div>
      <div className="aw-view" role="group" aria-label="Modo de visualização">
        <button aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={17}/> Lista</button>
        <button aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}><CalendarDays size={17}/> Calendário</button>
      </div>
    </div>

    {current === 'Home' && <div className="aw-overview">
      {[[ClipboardList, 'Tarefas', due.filter(task => !isDone(task)).length],
        [CalendarCheck, 'Rotinas', routines.filter(task => !isDone(task)).length],
        [CalendarDays, 'Reuniões', todaysMeetings.length]].map(([Icon, label, count]) =>
        <button key={label} onClick={() => go(label)}><Icon size={19}/><strong>{count}</strong><span>{label}</span></button>)}
    </div>}

    {view === 'calendar' && <AgendaCalendar key={current} date={date} tasks={calendarTasks}
      meetings={current === 'Home' || current === 'Reuniões' ? meetings : []}
      onMeeting={id => { onSection('Reuniões'); setOpenedMeeting(id); setView('list'); }}/>}
    {view === 'list' && current === 'Home' && <section className="task-panel">
      <div className="panel-head"><h2>Minha agenda de hoje</h2></div>
      <TaskRows tasks={[...due, ...routines]} date={date} isDone={isDone} toggle={toggle}/>
      {todaysMeetings.map(meeting => <button className="aw-meeting-row" key={meeting.id}
        onClick={() => { onSection('Reuniões'); setOpenedMeeting(meeting.id); }}>
        <CalendarDays size={18}/><strong>{meeting.title}</strong><span>Reunião</span>
      </button>)}
    </section>}
    {view === 'list' && ['Rotinas', 'Tarefas'].includes(current) && <section className="task-panel">
      <div className="panel-head"><h2>{current === 'Rotinas' ? 'Minhas rotinas' : 'Minhas tarefas'}</h2>
        <button className="primary" onClick={() => onAdd(current === 'Rotinas' ? 'routine' : 'demand')}>
          <Plus size={16}/>{current === 'Rotinas' ? 'Nova rotina' : 'Nova tarefa'}
        </button>
      </div>
      <TaskRows tasks={list} date={date} isDone={isDone} toggle={toggle}/>
    </section>}
    {current === 'Reuniões' && <div hidden={view !== 'list'}>{renderMeetings(openedMeeting)}</div>}

    <dialog ref={menu} className="aw-profile" aria-labelledby="aw-profile-title"
      onClick={event => { if (event.target === event.currentTarget) menu.current.close(); }}>
      <div className="aw-profile-body">
        <div className="aw-profile-heading">
          <h2 id="aw-profile-title"><Settings size={20}/> Configurações</h2>
          <button className="secondary" aria-label="Fechar configurações" onClick={() => menu.current.close()}><X size={18}/></button>
        </div>
        <p><strong>Anelisa</strong><br/>{email}</p>
        <label>Alterar foto neste navegador<input type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto}/></label>
        {photoError && <p role="alert">{photoError}</p>}
        <button className="secondary" onClick={signOut}><LogOut size={17}/> Sair da conta</button>
      </div>
    </dialog>
  </main>;
}
