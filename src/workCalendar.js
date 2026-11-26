const toDate = value => new Date(value + 'T12:00:00');
const iso = date => date.toLocaleDateString('en-CA');
const nextDay = value => { const date = toDate(value); date.setDate(date.getDate() + 1); return iso(date); };

export function createWorkCalendar(holidaysForMonth, timeOffs = [], schedule = {}) {
  const holidays = new Map();
  const candidates = new Map();

  function dayOffLabel(day) {
    const period = timeOffs.find(event => event.event_date <= day && day <= (event.end_date || event.event_date));
    if (period) return period.title || 'Sem expediente';
    const date = toDate(day);
    if (date.getDay() === 0 && !schedule.work_sunday) return 'Domingo';
    if (date.getDay() === 6 && !schedule.work_saturday) return 'Sábado';
    const key = day.slice(0, 7);
    if (!holidays.has(key)) holidays.set(key, holidaysForMonth(date.getFullYear(), date.getMonth()));
    return schedule.work_holidays ? '' : holidays.get(key)[day] || '';
  }

  function isWorkday(day) {
    return !dayOffLabel(day);
  }

  function adjustDeadline(day) {
    if (!day) return day;
    const date = toDate(day);
    while (!isWorkday(iso(date))) date.setDate(date.getDate() - 1);
    return iso(date);
  }

  function candidateDays(day) {
    if (!isWorkday(day)) return [];
    if (!candidates.has(day)) {
      const dates = [day];
      for (let next = nextDay(day); !isWorkday(next); next = nextDay(next)) dates.push(next);
      candidates.set(day, dates);
    }
    return candidates.get(day);
  }

  function routineDates(task, day, routineOccurs) {
    if (!isWorkday(day)) return [];
    const dates = task.recurrence_type === 'daily' ? [day] : candidateDays(day);
    return dates.filter(date => routineOccurs(task, date));
  }

  function eventOccurs(event, day, originalRule) {
    if (!isWorkday(day)) return false;
    if (!event.recurrence_type || event.recurrence_type === 'none') return adjustDeadline(event.event_date) === day;
    return candidateDays(day).some(date => originalRule(event, date));
  }

  return { isWorkday, dayOffLabel, adjustDeadline, routineDates, eventOccurs };
}

export function projectDeadline(record, field, calendar, fallback) {
  const requested = record[field] || fallback;
  if (!requested || ['completed', 'filled', 'cancelled'].includes(record.status)) return record;
  return { ...record, ['requested_' + field]: requested, [field]: calendar.adjustDeadline(requested) };
}

export async function loadCalendarEvents(client, userId) {
  const events = [];
  const pageSize = 500;
  try {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from('deadline_events').select('*')
        .eq('user_id', userId).order('event_date', { ascending: true })
        .order('id', { ascending: true }).range(offset, offset + pageSize - 1);
      if (error) return { data: null, error };
      events.push(...data);
      if (data.length < pageSize) return { data: events, error: null };
    }
  } catch (error) { return { data: null, error }; }
}
