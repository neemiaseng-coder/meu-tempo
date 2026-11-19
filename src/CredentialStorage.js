const toBase64 = value => btoa(Array.from(new Uint8Array(value), byte => String.fromCharCode(byte)).join(''));
const fromBase64 = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

export async function encryptValue(value, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(value),
  );
  return [toBase64(salt), toBase64(iv), toBase64(encrypted)].join(':');
}

export async function decryptValue(value, password) {
  const [salt, iv, encrypted] = value.split(':').map(fromBase64);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

async function accountKey(client, userId, create) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('meu-tempo:credential-key:' + userId));
  const bytes = new Uint8Array(hash).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  const id = [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-');
  const lookup = () => client.from('quick_records').select('content')
    .eq('id', id).eq('user_id', userId).eq('metadata->>kind', 'credential_key').maybeSingle();
  let result = await lookup();
  if (result.error) throw result.error;
  if (!result.data && create) {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('');
    const write = await client.from('quick_records').upsert({
      id, user_id: userId, record_type: 'snippet', title: 'Proteção dos acessos',
      content: key, metadata: { kind: 'credential_key' },
    }, { onConflict: 'id', ignoreDuplicates: true });
    if (write.error) throw write.error;
    result = await lookup();
    if (result.error) throw result.error;
  }
  if (!result.data?.content) throw new Error('Não foi possível carregar a proteção dos acessos.');
  return result.data.content;
}

export async function encryptCredential(client, userId, password) {
  return encryptValue(password, await accountKey(client, userId, true));
}

export async function readCredential(client, userId, record, master) {
  const key = record.metadata?.credential_encryption === 'account-v1'
    ? await accountKey(client, userId, false) : master;
  if (!key) throw new Error('Informe a senha mestra usada no cadastro antigo.');
  return decryptValue(record.encrypted_payload, key);
}
