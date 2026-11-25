export const WORKSPACE_START = '2026-11-12';

const pageSize = 500;

export async function loadTaskOccurrences(client, userId, through) {
  const occurrences = [];
  try {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from('task_occurrences')
        .select('*')
        .eq('user_id', userId)
        .gte('occurrence_date', WORKSPACE_START)
        .lte('occurrence_date', through)
        .order('occurrence_date', { ascending: true })
        .order('task_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) return { data: null, error };
      occurrences.push(...data);
      if (data.length < pageSize) return { data: occurrences, error: null };
    }
  } catch (error) {
    return { data: null, error };
  }
}
