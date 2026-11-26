import assert from 'node:assert/strict';
import test from 'node:test';
import { dayActivities, vacancyRemaining } from './dayActivities.js';

test('exibe tarefas futuras e sem prazo todos os dias enquanto pendentes', () => {
  const tasks = [
    { id: 'future', task_type: 'demand', status: 'pending', due_date: '2026-12-10' },
    { id: 'no-date', task_type: 'demand', status: 'pending' },
    { id: 'late', task_type: 'demand', status: 'pending', due_date: '2026-11-20' },
    { id: 'cancelled', task_type: 'demand', status: 'cancelled' },
    { id: 'inactive', task_type: 'demand', status: 'pending', is_active: false },
  ];
  for (const date of ['2026-11-26', '2026-11-27', '2026-12-11']) {
    assert.deepEqual(dayActivities(tasks, date, () => false).map(task => task.id), ['future', 'no-date', 'late']);
  }
});

test('permite concluir antes do prazo e mantém a conclusão apenas no dia em que foi feita', () => {
  const task = { id: 'early', task_type: 'demand', status: 'completed',
    due_date: '2026-12-10', completed_at: '2026-11-26T15:00:00Z' };
  assert.equal(dayActivities([task], '2026-11-26', () => false).length, 1);
  assert.equal(dayActivities([task], '2026-11-27', () => false).length, 0);
  assert.equal(dayActivities([task], '2026-12-10', () => false).length, 0);
});

test('rotinas aparecem conforme os dias programados', () => {
  const task = { id: 'weekly', task_type: 'routine', status: 'pending' };
  const due = (task, date) => date === '2026-11-26';
  assert.equal(dayActivities([task], '2026-11-26', due).length, 1);
  assert.equal(dayActivities([task], '2026-11-27', due).length, 0);
});

test('vaga só abate posições quando o processo de admissão está concluído', () => {
  const vacancy = { id: 'vacancy', quantity: 2 };
  const processes = [
    { vacancy_id: 'vacancy', process_type: 'admission', status: 'open' },
    { vacancy_id: 'vacancy', process_type: 'admission', status: 'completed' },
    { vacancy_id: 'vacancy', process_type: 'termination', status: 'completed' },
  ];
  assert.equal(vacancyRemaining(vacancy, processes), 1);
  processes[0].status = 'completed';
  assert.equal(vacancyRemaining(vacancy, processes), 0);
});
