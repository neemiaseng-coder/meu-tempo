import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTaskOccurrences } from './taskOccurrences.js';

function historyClient(rows, failPage = -1) {
  let page = 0;
  return {
    from(table) {
      assert.equal(table, 'task_occurrences');
      const filters = {};
      return {
        select() { return this; },
        eq(field, value) { filters[field] = value; return this; },
        gte(field, value) { filters.from = value; return this; },
        lte(field, value) { filters.through = value; return this; },
        order() { return this; },
        async range(from, to) {
          if (page++ === failPage) return { data: null, error: new Error('Falha de conexão') };
          return {
            data: rows.filter(row => row.user_id === filters.user_id &&
              row.occurrence_date >= filters.from && row.occurrence_date <= filters.through)
              .slice(from, to + 1),
            error: null,
          };
        },
      };
    },
  };
}

test('preserva conclusões anteriores à semana atual ao carregar no dia seguinte', async () => {
  const rows = [
    { user_id: 'anelisa', task_id: 'daily', occurrence_date: '2026-11-20', status: 'completed' },
    { user_id: 'anelisa', task_id: 'daily', occurrence_date: '2026-11-23', status: 'completed' },
    { user_id: 'anelisa', task_id: 'daily', occurrence_date: '2026-11-24', status: 'completed' },
    { user_id: 'outro', task_id: 'private', occurrence_date: '2026-11-24', status: 'completed' },
  ];
  const yesterday = await loadTaskOccurrences(historyClient(rows), 'anelisa', '2026-11-24');
  const today = await loadTaskOccurrences(historyClient(rows), 'anelisa', '2026-11-25');
  assert.equal(today.error, null);
  assert.deepEqual(today.data, yesterday.data);
  assert.deepEqual(today.data.map(row => row.occurrence_date), ['2026-11-20', '2026-11-23', '2026-11-24']);
});

test('carrega todas as páginas de um histórico com mais de mil conclusões', async () => {
  const rows = Array.from({ length: 1203 }, (_, index) => ({
    user_id: 'anelisa', task_id: String(index), occurrence_date: '2026-11-24', status: 'completed',
  }));
  const result = await loadTaskOccurrences(historyClient(rows), 'anelisa', '2026-11-25');
  assert.equal(result.error, null);
  assert.equal(result.data.length, rows.length);
  assert.equal(result.data.at(-1).task_id, '1202');
});

test('descarta histórico parcial se uma página falhar', async () => {
  const rows = Array.from({ length: 600 }, (_, index) => ({
    user_id: 'anelisa', task_id: String(index), occurrence_date: '2026-11-24', status: 'completed',
  }));
  const result = await loadTaskOccurrences(historyClient(rows, 1), 'anelisa', '2026-11-25');
  assert.equal(result.data, null);
  assert.match(result.error.message, /Falha/);
});
