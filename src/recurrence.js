const dayMs = 86_400_000;

export const weekdays = [
  ['Seg', 1], ['Ter', 2], ['Qua', 3], ['Qui', 4],
  ['Sex', 5], ['Sáb', 6], ['Dom', 0],
];

const utcDate = date => new Date(date + 'T00:00:00Z');
const monday = date => date.getTime() - ((date.getUTCDay() + 6) % 7) * dayMs;

export function occursOn(task, date) {
  const { due_date: start, recurrence_end: end, recurrence_type: type,
    recurrence_days: days = [] } = task;
  if (task.task_type !== 'routine' || task.is_active === false ||
      (start && date < start) || (end && date > end)) return false;
  const current = utcDate(date);
  if (type === 'daily') return true;
  if (type === 'monthly') return (days || []).includes(current.getUTCDate());
  if (type === 'weekly') return (days || []).includes(current.getUTCDay());
  if (type === 'biweekly' && start && (days || []).includes(current.getUTCDay())) {
    return (monday(current) - monday(utcDate(start))) % (14 * dayMs) === 0;
  }
  return false;
}

export const recurrenceLabels = {
  daily: 'Diária', weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal',
};
