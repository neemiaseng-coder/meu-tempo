import React from 'react';
import { Briefcase, ClipboardList } from 'lucide-react';

const dateLabel = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem prazo';

export default function DayFollowUps({ vacancies, processes, date, vacancyOpenCount, processProgress, onVacancy, onProcess }) {
  const pending = processes.filter(process => !['completed', 'cancelled'].includes(process.status));
  if (!vacancies.length && !pending.length) return null;
  return <section className="task-panel day-followups" aria-labelledby="day-followups-title">
    <div className="panel-head"><h2 id="day-followups-title">Acompanhar hoje</h2></div>
    <div className="day-followup-list">
      {vacancies.map(vacancy => <article className="day-followup-card" key={vacancy.id}
        data-overdue={Boolean(vacancy.target_date && vacancy.target_date < date) || undefined}>
        <span className="day-followup-kind"><Briefcase size={17}/> Vaga aberta</span>
        <div className="day-followup-body"><h3>{vacancy.title}</h3>
        <p>{[vacancy.unit, vacancyOpenCount(vacancy) + ' posição(ões) em aberto'].filter(Boolean).join(' · ')}</p>
        <small>Prazo da contratação · {dateLabel(vacancy.target_date)}</small>
        {vacancy.target_date && vacancy.target_date < date && <span className="day-followup-late">Prazo vencido</span>}
        </div><button className="secondary" onClick={() => onVacancy(vacancy)}>Editar vaga</button>
      </article>)}
      {pending.map(process => <article className="day-followup-card" key={process.id}
        data-overdue={Boolean(process.due_date && process.due_date < date) || undefined}>
        <span className="day-followup-kind"><ClipboardList size={17}/> {process.process_type === 'termination' ? 'Rescisão' : 'Admissão'}</span>
        <div className="day-followup-body"><h3>{process.person_name}</h3>
        <p>{[process.role, process.unit].filter(Boolean).join(' · ')}</p>
        <small>Prazo · {dateLabel(process.due_date)}</small>
        {process.due_date && process.due_date < date && <span className="day-followup-late">Prazo vencido</span>}
        <div className="day-followup-progress">
          <progress aria-label={'Andamento de ' + process.person_name} value={processProgress(process)} max="100"/>
          <span>{processProgress(process)}%</span>
        </div>
        </div><button className="secondary" onClick={() => onProcess(process)}>Acompanhar processo</button>
      </article>)}
    </div>
  </section>;
}
