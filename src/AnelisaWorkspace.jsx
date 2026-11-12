import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bell, CalendarCheck, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  CirclePlus, House, List, LogOut, MessageCircle, Music2, Pencil, Repeat2, Settings, SquarePen, Video, X } from 'lucide-react';
import ActivityEditor from './ActivityEditor.jsx';
import DailyQuotes from './DailyQuotes.jsx';
import { AgendaSidebar } from './AgendaExtras.jsx';
import './anelisa.css';

const appearance = {
  facebook: { label: 'Facebook', Brand: House, Task: ClipboardList, Routine: CalendarCheck, Meeting: CalendarDays },
  instagram: { label: 'Instagram', Brand: Camera, Task: SquarePen, Routine: Repeat2, Meeting: MessageCircle },
  tiktok: { label: 'TikTok', Brand: Music2, Task: CirclePlus, Routine: Repeat2, Meeting: Video },
};

const shortWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
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
    || (task.recurrence_type === 'monthly' && (schedule.length ? schedule.includes(day.getDate()) : task.scheduled_date === date));
}

function TaskRows({ tasks, date, isDone, toggle, onEdit }) {
  if (!tasks.length) return <p className="aw-empty">Nenhuma atividade nesta lista.</p>;
  return tasks.map(task => {
    const routine = isRoutine(task);
    const scheduled = !routine || routineOccurs(task, date);
    const done = isDone(task);
    const variableMonth = routine && task.recurrence_type === 'monthly' && !task.recurrence_days?.length;
    const status = done ? 'Concluída' : routine ? scheduled ? 'Hoje' : variableMonth && !task.scheduled_date ? 'Data a definir' : 'Fora da programação de hoje'
      : !task.due_date ? 'Sem prazo' : task.due_date < date ? 'Em atraso' : task.due_date === date ? 'Hoje' : 'Agendada';
    const scheduledLabel = routine && task.recurrence_type === 'weekly'
      ? (task.recurrence_days ?? []).map(day => shortWeekdays[day]).join(', ')
      : variableMonth && task.scheduled_date ? toDate(task.scheduled_date).toLocaleDateString('pt-BR') : '';
    const subtitle = routine ? [frequencies[task.recurrence_type], scheduledLabel].filter(Boolean).join(' · ')
      : task.due_date && toDate(task.due_date).toLocaleDateString('pt-BR');
    return <div className="anelisa-task" key={task.id}>
      <button className={'myday-check' + (done ? ' checked' : '')} disabled={!scheduled}
        aria-pressed={done} aria-label={task.title} onClick={() => toggle(task)}>{done && <Check size={16}/>}</button>
      <div><strong>{task.title}</strong><small>{subtitle}</small>
        {task.description && <details className="aw-task-description"><summary>Detalhes</summary><p>{task.description}</p></details>}
      </div>
      <span className={status === 'Em atraso' ? 'aw-late' : undefined}>{status}</span>
      <button className="aw-edit" aria-label={'Editar ' + task.title} onClick={() => onEdit(task)}><Pencil size={16}/></button>
    </div>;
  });
}

export function AgendaCalendar({ date, tasks, meetings, onMeeting, onEdit, holidaysForMonth, events = [], occursOn, onReminder, onEvent }) {
  const [selected, setSelected] = useState(date);
  const [month, setMonth] = useState(() => new Date(toDate(date).getFullYear(), toDate(date).getMonth(), 1, 12));
  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const days = new Date(year, monthNumber + 1, 0).getDate();
  const holidays = holidaysForMonth(year, monthNumber);

  function entries(day) {
    return [
      ...tasks.filter(task => isRoutine(task) ? routineOccurs(task, day) : task.due_date === day)
        .map(task => ({ ...task, kind: isRoutine(task) ? 'Rotina' : 'Tarefa' })),
      ...events.filter(event => occursOn(event, day)).map(event => ({ ...event, kind: event.event_type === 'other' ? 'Lembrete' : 'Evento' })),
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
        const holiday = holidays[value];
        const dayType = holiday ? 'holiday' : day.getDay() === 6 ? 'saturday' : day.getDay() === 0 ? 'sunday' : undefined;
        return <button key={value} className="aw-day" data-day-type={dayType} title={holiday} aria-pressed={selected === value}
          aria-current={date === value ? 'date' : undefined}
          aria-label={fullDate.format(day) + (holiday ? ', ' + holiday : '') + (count ? ', ' + count + (count === 1 ? ' item' : ' itens') : '')}
          onClick={() => setSelected(value)}>
          {index + 1}{count > 0 && <span className="aw-day-dot"/>}
        </button>;
      })}
    </div>
    <div className="aw-calendar-legend" aria-label="Legenda do calendário">
      <span data-day-type="saturday">Sábado</span><span data-day-type="sunday">Domingo</span><span data-day-type="holiday">Feriado</span>
    </div>
    <div className="aw-agenda">
      <div className="agenda-day-heading"><h3>{fullDate.format(toDate(selected))}</h3>
        {onReminder && <button className="secondary" onClick={() => onReminder(selected)}><Bell size={16}/> Incluir lembrete</button>}
      </div>
      {holidays[selected] && <p className="aw-holiday-name">{holidays[selected]}</p>}
      {agenda.length ? <ul>{agenda.map(item => <li key={item.kind + item.id}>
        <span>{item.kind}</span>
        {item.kind === 'Reunião' ? <button onClick={() => onMeeting(item.id)}>{item.title}</button>
          : item.kind === 'Lembrete' ? <button onClick={() => onReminder(selected, item)}>{item.description || item.title}</button>
          : item.kind === 'Evento' ? (onEvent ? <button onClick={() => onEvent(item)}>{item.title}</button> : <strong>{item.title}</strong>)
          : onEdit ? <button onClick={() => onEdit(item)}>{item.title}</button> : <strong>{item.title}</strong>}
      </li>)}</ul> : <p className="aw-empty">Nenhum item para este dia.</p>}
    </div>
  </section>;
}

export default function AnelisaWorkspace({ tasks, date, isDone, toggle, onSaveActivity,
  meetings, renderMeetings, signOut, userId, email, holidaysForMonth, events, occursOn, onReminder, reminderDialog }) {
  const themeKey = 'meu-tempo-theme-' + userId;
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(themeKey);
      return Object.hasOwn(appearance, saved) ? saved : 'facebook';
    } catch {
      return 'facebook';
    }
  });
  const { Brand, Task, Routine, Meeting } = appearance[theme];
  function selectTheme(next) {
    setTheme(next);
    try { localStorage.setItem(themeKey, next); } catch { /* A escolha continua valendo na sessão. */ }
  }

  const [route, setRoute] = useState(null);
  const [view, setView] = useState('list');
  const meetingMenu = route?.screen === 'meeting-menu';
  const meetingRoute = route?.screen === 'meeting' ? route : null;
  const activity = route?.screen === 'activity'
    ? route.id ? tasks.find(task => task.id === route.id) : { task_type: route.type }
    : null;
  const [photo, setPhoto] = useState(() => localStorage.getItem('meu-tempo-photo-' + userId) || '');
  const [photoError, setPhotoError] = useState('');
  const menu = useRef(null);
  const active = tasks.filter(task => task.is_active !== false && task.status !== 'cancelled');
  const routines = active.filter(task => routineOccurs(task, date));
  const due = active.filter(task => !isRoutine(task) && task.due_date &&
    (task.due_date === date || (task.due_date < date && !isDone(task))));
  const plannedToday = [...due.filter(task => task.due_date === date), ...routines];
  const completedToday = plannedToday.filter(isDone).length;
  const progress = plannedToday.length ? Math.round(completedToday / plannedToday.length * 100) : 0;
  const todaysMeetings = meetings.filter(meeting => meeting.meeting_date === date);
  const agendaToday = [...due, ...routines];
  const recentMeetings = [...meetings].filter(meeting => meeting.finalized_at)
    .sort((a, b) => b.finalized_at.localeCompare(a.finalized_at)).slice(0, 3);
  const remainingActivities = active.filter(task => !agendaToday.includes(task));

  useEffect(() => {
    const syncRoute = () => {
      setRoute(window.history.state?.meuTempoRoute ?? null);
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  function openRoute(next) {
    const state = { ...window.history.state, meuTempoRoute: next };
    if (window.history.state?.meuTempoRoute) window.history.replaceState(state, '');
    else window.history.pushState(state, '');
    setRoute(next);
  }

  function goHome() {
    if (window.history.state?.meuTempoRoute) window.history.back();
  }

  const openMeeting = id => openRoute({ screen: 'meeting', mode: 'detail', id });
  const onEdit = task => openRoute({ screen: 'activity', id: task.id });
  const onAdd = type => openRoute({ screen: 'activity', type });

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

  return <main className="anelisa-workspace" data-aw-theme={theme}>
    <header className="aw-header">
      <button className="aw-brand" aria-label="Início do Meu Tempo" onClick={goHome}>
        <span className="aw-logo"><Brand size={19}/></span> <span>Meu Tempo</span>
      </button>
      <button className="aw-avatar" aria-label="Abrir configurações do perfil" aria-haspopup="dialog"
        onClick={() => menu.current.showModal()}>{photo ? <img src={photo} alt=""/> : 'A'}</button>
    </header>

    <div className="aw-layout agenda-layout">
      <div className="aw-feed">
        <div className="aw-meeting-nav">
          {meetingRoute && <button className="secondary aw-home-back" onClick={goHome}><ArrowLeft size={17}/> Início</button>}
          <button className="secondary aw-meeting-trigger" aria-expanded={meetingMenu} aria-controls="aw-meeting-options"
            onClick={() => meetingMenu ? goHome() : openRoute({ screen: 'meeting-menu' })}><Meeting size={18}/> Reunião <ChevronDown size={15}/></button>
          {meetingMenu && <div id="aw-meeting-options" className="aw-meeting-options">
            <button onClick={() => openRoute({ screen: 'meeting', mode: 'start' })}>Iniciar reunião</button>
            <button onClick={() => openRoute({ screen: 'meeting', mode: 'history' })}>Reuniões realizadas</button>
          </div>}
        </div>
        {meetingRoute ? renderMeetings(meetingRoute.id, meetingRoute.mode) : <>
          <div className="aw-heading">
            <div><p>{fullDate.format(toDate(date))}</p><h1>Olá, Anelisa</h1></div>
            <div className="aw-view" role="group" aria-label="Modo de visualização">
              <button aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={17}/> Lista</button>
              <button aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}><CalendarDays size={17}/> Calendário</button>
            </div>
          </div>
          <DailyQuotes key={date} date={date}/>
          <div className="aw-home-content">
          <div className="aw-action-cards">
            <button onClick={() => onAdd('demand')}><span className="aw-action-icon"><Task size={20}/></span> Incluir tarefa</button>
            <button onClick={() => onAdd('routine')}><span className="aw-action-icon"><Routine size={20}/></span> Incluir rotina</button>
            <button onClick={() => onReminder(date)}><span className="aw-action-icon"><Bell size={20}/></span> Incluir lembrete</button>
          </div>
          <section className="aw-progress" aria-labelledby="aw-progress-title">
            <div className="aw-progress-head">
              <div><h2 id="aw-progress-title">Progresso do dia</h2>
                <p>{completedToday} de {plannedToday.length} {plannedToday.length === 1 ? 'atividade concluída' : 'atividades concluídas'}</p>
              </div>
              <strong>{progress}%</strong>
            </div>
            <progress aria-labelledby="aw-progress-title" value={progress} max="100">{progress}%</progress>
          </section>
          <div className="aw-home-agenda">
          {view === 'calendar' ? <AgendaCalendar date={date} tasks={active} holidaysForMonth={holidaysForMonth}
            meetings={meetings} onEdit={onEdit} onMeeting={openMeeting} events={events} occursOn={occursOn} onReminder={onReminder}/> : <section className="task-panel">
            <div className="panel-head"><h2>Minha agenda de hoje</h2></div>
            <TaskRows tasks={agendaToday} date={date} isDone={isDone} toggle={toggle} onEdit={onEdit}/>
            {events.filter(event => event.event_type === 'other' && occursOn(event, date)).map(event =>
              <button className="aw-meeting-row" key={event.id} onClick={() => onReminder(date, event)}>
                <Bell size={18}/><strong>{event.description || event.title}</strong><span>Lembrete</span>
              </button>)}
            {todaysMeetings.map(meeting => <button className="aw-meeting-row" key={meeting.id} onClick={() => openMeeting(meeting.id)}>
              <Meeting size={18}/><strong>{meeting.title}</strong><span>Reunião</span>
            </button>)}
          </section>}
          {remainingActivities.length > 0 && <details className="task-panel aw-other-activities">
            <summary>Outras tarefas e rotinas</summary>
            <TaskRows tasks={remainingActivities} date={date} isDone={isDone} toggle={toggle} onEdit={onEdit}/>
          </details>}
          </div>
          </div>
        </>}
      </div>
      <AgendaSidebar events={events} date={date} occursOn={occursOn} onReminder={onReminder}>
        <p>O calendário agora permite incluir lembretes rápidos.</p>
        {recentMeetings.length > 0 && <ul>{recentMeetings.map(meeting => <li key={meeting.id}>
          <button onClick={() => openMeeting(meeting.id)}>{meeting.title}</button><small>Reunião realizada</small>
        </li>)}</ul>}
      </AgendaSidebar>
    </div>

    {reminderDialog}
    {activity && <ActivityEditor task={activity} date={date} onSave={onSaveActivity} onClose={goHome}/>}

    <dialog ref={menu} className="aw-profile" aria-labelledby="aw-profile-title"
      onClick={event => { if (event.target === event.currentTarget) menu.current.close(); }}>
      <div className="aw-profile-body">
        <div className="aw-profile-heading">
          <h2 id="aw-profile-title"><Settings size={20}/> Configurações</h2>
          <button className="secondary" aria-label="Fechar configurações" onClick={() => menu.current.close()}><X size={18}/></button>
        </div>
        <p><strong>Anelisa</strong><br/>{email}</p>
        <fieldset className="aw-theme-picker">
          <legend>Tema</legend>
          {Object.entries(appearance).map(([key, option]) => <label key={key}>
            <input type="radio" name="aw-theme" value={key} checked={theme === key} onChange={() => selectTheme(key)}/>
            <option.Brand size={17} aria-hidden="true"/> {option.label}
          </label>)}
        </fieldset>
        <label>Alterar foto neste navegador<input type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto}/></label>
        {photoError && <p role="alert">{photoError}</p>}
        <button className="secondary" onClick={signOut}><LogOut size={17}/> Sair da conta</button>
      </div>
    </dialog>
  </main>;
}
