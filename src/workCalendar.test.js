import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkCalendar, projectDeadline, loadCalendarEvents } from './workCalendar.js';
import { workHolidaysForMonth } from './holidays.js';

const calendar = createWorkCalendar(workHolidaysForMonth);
function scheduled(task, date) {
  if (date < task.due_date || (task.recurrence_end && date > task.recurrence_end)) return false;
  const day = new Date(date + 'T12:00:00');
  if (task.recurrence_type === 'daily') return true;
  if (task.recurrence_type === 'weekly') return task.recurrence_days.includes(day.getDay());
  return task.recurrence_days.includes(day.getDate());
}

test('antecipa finais de semana e feriados nacionais, estaduais e municipais', () => {
  assert.equal(calendar.adjustDeadline('2026-11-22'), '2026-11-19');
  assert.equal(calendar.adjustDeadline('2026-12-08'), '2026-12-07');
  assert.equal(calendar.adjustDeadline('2026-07-09'), '2026-07-08');
  assert.equal(calendar.adjustDeadline('2027-01-01'), '2026-12-31');
  assert.equal(calendar.adjustDeadline('2026-11-26'), '2026-11-26');
});

test('considera o período completo sem expediente e a sobreposição de períodos', () => {
  const off = createWorkCalendar(workHolidaysForMonth, [
    { event_date: '2026-12-07', end_date: '2026-12-09', title: 'Folga' },
    { event_date: '2026-12-09', end_date: '2026-12-11', title: 'Ausência' },
  ]);
  assert.equal(off.adjustDeadline('2026-12-11'), '2026-12-04');
  assert.equal(off.isWorkday('2026-12-09'), false);
  assert.equal(calendar.adjustDeadline('2026-12-11'), '2026-12-11');
});

test('rotinas diárias só aparecem em dias de trabalho', () => {
  const task = { due_date: '2026-11-01', recurrence_type: 'daily' };
  assert.deepEqual(calendar.routineDates(task, '2026-11-19', scheduled), ['2026-11-19']);
  assert.deepEqual(calendar.routineDates(task, '2026-11-20', scheduled), []);
  assert.deepEqual(calendar.routineDates(task, '2026-11-22', scheduled), []);
});

test('rotinas semanais e mensais preservam as datas originais das ocorrências antecipadas', () => {
  const weekly = { due_date: '2026-11-01', recurrence_type: 'weekly', recurrence_days: [0] };
  const monthly = { due_date: '2026-11-01', recurrence_type: 'monthly', recurrence_days: [20] };
  assert.deepEqual(calendar.routineDates(weekly, '2026-11-19', scheduled), ['2026-11-22']);
  assert.deepEqual(calendar.routineDates(monthly, '2026-11-19', scheduled), ['2026-11-20']);
  assert.deepEqual(calendar.routineDates(weekly, '2026-11-22', scheduled), []);
});

test('mover prazo não modifica a data informada e pode ser recalculado ao remover a folga', () => {
  const task = { id: 'task', due_date: '2026-11-26', status: 'pending' };
  const off = createWorkCalendar(workHolidaysForMonth, [
    { event_date: '2026-11-26', end_date: '2026-11-27', title: 'Sem expediente' },
  ]);
  const projected = projectDeadline(task, 'due_date', off);
  assert.equal(projected.due_date, '2026-11-25');
  assert.equal(projected.requested_due_date, '2026-11-26');
  assert.equal(task.due_date, '2026-11-26');
  assert.equal(projectDeadline(task, 'due_date', calendar).due_date, '2026-11-26');
});

test('prazos recorrentes antecipam cada ocorrência', () => {
  const event = { event_date: '2026-11-01', recurrence_type: 'weekly' };
  const sunday = (event, date) => date >= event.event_date && new Date(date + 'T12:00:00').getDay() === 0;
  assert.equal(calendar.eventOccurs(event, '2026-11-19', sunday), true);
  assert.equal(calendar.eventOccurs(event, '2026-11-22', sunday), false);
});

test('preserva prazos históricos de itens concluídos', () => {
  const closed = { due_date: '2026-11-22', status: 'completed' };
  assert.equal(projectDeadline(closed, 'due_date', calendar), closed);
});

test('cada usuário pode trabalhar aos sábados, domingos e feriados de forma independente', () => {
  const saturday = createWorkCalendar(workHolidaysForMonth, [], { work_saturday: true });
  const all = createWorkCalendar(workHolidaysForMonth, [], { work_saturday: true, work_sunday: true, work_holidays: true });
  assert.equal(calendar.isWorkday('2026-11-28'), false);
  assert.equal(saturday.isWorkday('2026-11-28'), true);
  assert.equal(saturday.isWorkday('2026-11-29'), false);
  assert.equal(saturday.isWorkday('2026-11-20'), false);
  assert.equal(all.isWorkday('2026-11-29'), true);
  assert.equal(all.isWorkday('2026-11-20'), true);
});

test('sem expediente bloqueia o dia mesmo para quem trabalha em finais de semana e feriados', () => {
  const all = createWorkCalendar(workHolidaysForMonth,
    [{ event_date: '2026-11-20', end_date: '2026-11-22', title: 'Ausência' }],
    { work_saturday: true, work_sunday: true, work_holidays: true });
  assert.equal(all.isWorkday('2026-11-22'), false);
  assert.equal(all.adjustDeadline('2026-11-22'), '2026-11-19');
});

test('rotina de segunda sem expediente antecipa para sexta e mantém a ocorrência de origem', () => {
  const off = createWorkCalendar(workHolidaysForMonth, [
    { event_date: '2026-11-30', end_date: '2026-11-30', title: 'Folga' },
  ]);
  const task = { due_date: '2026-11-01', recurrence_type: 'weekly', recurrence_days: [1] };
  assert.deepEqual(off.routineDates(task, '2026-11-27', scheduled), ['2026-11-30']);
  assert.deepEqual(off.routineDates(task, '2026-11-30', scheduled), []);
});


test('carrega o calendário completo para não perder períodos sem expediente depois de mil registros', async () => {
  const rows = Array.from({ length: 1001 }, (_, id) => ({ id: String(id) }));
  const client = { from: () => ({
    select() { return this; }, eq() { return this; }, order() { return this; },
    async range(start, end) { return { data: rows.slice(start, end + 1), error: null }; },
  }) };
  const result = await loadCalendarEvents(client, 'user');
  assert.equal(result.error, null);
  assert.equal(result.data.length, 1001);
  assert.equal(result.data.at(-1).id, '1000');
});
