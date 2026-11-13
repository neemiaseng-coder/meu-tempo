import React, { useState } from 'react';
import { ContactRound } from 'lucide-react';

export default function AnelisaContacts({ records, onSave }) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const contacts = records.map(record => {
    try {
      const data = JSON.parse(record.content);
      return { id: record.id, name: data?.name || record.title, phone: String(data?.phone ?? '') };
    } catch {
      return { id: record.id, name: record.title, phone: '' };
    }
  });

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const name = fields.get('name').trim();
    const phone = fields.get('phone').replace(/\D/g, '');
    if (!name || phone.length < 8 || phone.length > 15) {
      setError('Informe o nome e um telefone válido.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({ name, phone });
      setAdding(false);
    } catch {
      setError('Não foi possível salvar o contato. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <section data-card="contacts" className="aw-desk-card">
    <h2><ContactRound/> Contatos rápidos</h2>
    {contacts.length ? <ul>{contacts.map(({ id, name, phone }) => <li key={id}>
      {phone.replace(/\D/g, '') ? <a href={'tel:' + (phone.startsWith('+') ? '+' : '') + phone.replace(/\D/g, '')}>{name} <small>{phone}</small></a> : name}
    </li>)}</ul> : <p>Nenhum contato cadastrado.</p>}
    {adding ? <form onSubmit={submit}>
      <label>Nome<input name="name" maxLength={100} required/></label>
      <label>Telefone<input name="phone" type="tel" maxLength={25} required/></label>
      {error && <p role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar contato'}</button>
      <button type="button" className="secondary" disabled={busy} onClick={() => { setAdding(false); setError(''); }}>Cancelar</button>
    </form> : <button className="secondary" onClick={() => setAdding(true)}>Adicionar contato</button>}
  </section>;
}
