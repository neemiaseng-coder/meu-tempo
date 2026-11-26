import React from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';

export default function DayProgress({ completed = 0, total = 0, week }) {
  const count = Math.max(0, Math.min(completed, total));
  const remaining = Math.max(0, total - count);
  const percent = total > 0 ? Math.round(count / total * 100) : 0;
  const angle = percent / 100 * Math.PI * 2 - Math.PI / 2;
  return <section className="day-progress-card" data-complete={total > 0 && remaining === 0 || undefined} aria-label="Resumo do progresso">
    <svg className="day-progress-circuit" viewBox="0 0 500 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M352 8h55l12 8h63 M352 92h55l12-8h63"/><circle cx="486" cy="16" r="3"/><circle cx="486" cy="84" r="3"/>
    </svg>
    <div className="day-progress-orbit" role="progressbar" aria-label="Progresso de hoje" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={count + ' de ' + total + ' atividades concluídas'}>
      <svg viewBox="0 0 76 76" aria-hidden="true">
        <circle className="day-progress-orbit-guide" cx="38" cy="38" r="35"/>
        {Array.from({ length: 12 }, (_, i) => <path className="day-progress-tick" key={i} d="M38 1v3" transform={'rotate(' + i * 30 + ' 38 38)'}/>)}
        <circle className="day-progress-track" cx="38" cy="38" r="28"/>
        <circle className="day-progress-arc" cx="38" cy="38" r="28" pathLength="100" strokeDasharray={percent + ' 100'} transform="rotate(-90 38 38)"/>
        {percent > 0 && <circle className="day-progress-node" cx={38 + Math.cos(angle) * 28} cy={38 + Math.sin(angle) * 28} r="2.5"/>}
      </svg>
      <span aria-hidden="true">{percent}<small>%</small></span>
    </div>
    <div className="day-progress-copy">
      <span className="day-progress-label"><i aria-hidden="true"/> Progresso do dia</span>
      <p aria-live="polite">{total ? <><strong>{count}</strong><span> de {total} concluídas</span></> : <span>Nenhuma atividade programada</span>}</p>
      {week && <small>Semana · {week.completed}/{week.total} concluídas</small>}
    </div>
    <span className="day-progress-badge">{remaining ? <Clock3 size={14}/> : <CheckCircle2 size={14}/>} {remaining ? remaining + (remaining === 1 ? ' pendente' : ' pendentes') : total ? 'Dia concluído' : 'Sem pendências'}</span>
  </section>;
}
