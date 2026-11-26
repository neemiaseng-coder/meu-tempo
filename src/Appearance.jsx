import React, { useEffect, useId, useState } from 'react';
import { Bell, BellRing, Cake, Calendar, CalendarCheck, CalendarDays, Camera, CirclePlus, ClipboardList, Grid2X2, House, ListTodo, MessageCircle, Music2, Repeat2, SquarePen, Video, VideoIcon } from 'lucide-react';

export const appearances = {
  facebook: { label: 'Facebook', Brand: House, Task: ClipboardList, Routine: CalendarCheck, Meeting: CalendarDays, Alert: Bell, Birthday: Cake, Date: CalendarDays },
  instagram: { label: 'Instagram', Brand: Camera, Task: SquarePen, Routine: Repeat2, Meeting: MessageCircle, Alert: BellRing, Birthday: Cake, Date: Calendar },
  tiktok: { label: 'TikTok', Brand: Music2, Task: CirclePlus, Routine: Repeat2, Meeting: Video, Alert: BellRing, Birthday: Cake, Date: CalendarCheck },
  google: { label: 'Google', Brand: Grid2X2, Task: ListTodo, Routine: Calendar, Meeting: VideoIcon, Alert: Bell, Birthday: Cake, Date: Calendar },
};
const readTheme = id => {
  try { const saved = localStorage.getItem('meu-tempo-theme-' + id); return Object.hasOwn(appearances, saved) ? saved : 'facebook'; }
  catch { return 'facebook'; }
};
export function useAppearance(userId) {
  const [theme, setTheme] = useState(() => readTheme(userId));
  useEffect(() => { setTheme(readTheme(userId)); }, [userId]);
  function selectTheme(next) {
    if (!Object.hasOwn(appearances, next)) return;
    setTheme(next);
    if (userId) try { localStorage.setItem('meu-tempo-theme-' + userId, next); } catch { /* Mantém a seleção na sessão. */ }
  }
  return [theme, selectTheme];
}
export function ThemePicker({ theme, onChange }) {
  const group = useId();
  return <fieldset className="social-theme-picker"><legend>Aparência</legend>
    <p>Escolha o estilo do seu espaço.</p>
    <div>{Object.entries(appearances).map(([key, { label, Brand }]) => <label key={key} data-theme-option={key}>
      <input type="radio" name={group} value={key} checked={theme === key} onChange={() => onChange(key)}/>
      <span className="theme-swatch"><Brand size={20} aria-hidden="true"/></span><span>{label}</span>
    </label>)}</div>
  </fieldset>;
}
export function ProgressRing({ progress, label = 'Progresso de hoje' }) {
  return <div className="social-progress-ring" role="progressbar" aria-label={label} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20"/><circle cx="24" cy="24" r="20" pathLength="100" strokeDasharray={progress + ' 100'}/></svg>
    <span aria-hidden="true">{progress}%</span>
  </div>;
}
