export function activityDeadline(task) {
  return task.due_date || task.scheduled_date;
}

export function dayActivities(tasks, day, routineOccurs) {
  return tasks.filter(task => {
    if (task.is_active === false || task.status === 'cancelled') return false;
    if (task.task_type === 'routine') return routineOccurs(task, day);
    if (task.status !== 'completed') return true;
    return task.completed_at
      ? new Date(task.completed_at).toLocaleDateString('en-CA') === day
      : activityDeadline(task) === day;
  });
}

export function vacancyRemaining(vacancy, processes) {
  const hired = processes.filter(process => process.vacancy_id === vacancy.id &&
    process.process_type === 'admission' && process.status === 'completed').length;
  return Math.max(0, (vacancy.quantity || 1) - hired);
}
