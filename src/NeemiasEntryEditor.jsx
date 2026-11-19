import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';

const fields = {
  message_templates: [['title', 'Título'], ['body', 'Texto da mensagem', 'textarea']],
  vacancies: [['title', 'Cargo'], ['unit', 'Unidade'], ['department', 'Área'], ['contract_type', 'Tipo de contrato'],
    ['quantity', 'Quantidade', 'number'], ['notes', 'Observações', 'textarea']],
  hr_processes: [['person_name', 'Nome'], ['role', 'Cargo'], ['unit', 'Unidade'],
    ['due_date', 'Prazo', 'date'], ['notes', 'Observações', 'textarea']],
  company: [['razao', 'Razão social'], ['fantasia', 'Nome fantasia'], ['cnpj', 'CNPJ'], ['ie', 'Inscrição estadual'],
    ['cep', 'CEP'], ['street', 'Rua'], ['number', 'Número'], ['complement', 'Complemento'], ['district', 'Bairro'],
    ['city', 'Cidade'], ['state', 'Estado'], ['phone', 'Telefone'], ['email', 'E-mail'], ['responsible', 'Responsável']],
  contact: [['name', 'Nome do contato'], ['phone', 'Telefone'], ['email', 'E-mail']],
};

export function EntryActions({ label, onEdit, onDelete }) {
  return <div className="entry-actions">
    <button type="button" className="secondary" aria-label={'Editar ' + label} onClick={onEdit}><Pencil size={15}/> Editar</button>
    <button type="button" className="secondary" aria-label={'Excluir ' + label} onClick={onDelete}><Trash2 size={15}/> Excluir</button>
  </div>;
}

export default function NeemiasEntryEditor({ entry, table, onSave, onDelete, onClose, encryptValue }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const record = table === 'quick_records';
  const credential = record && entry.record_type === 'credential';
  let content = {};
  if (record && !credential) {
    try { content = JSON.parse(entry.content || '{}'); } catch { /* Mantém conteúdo legado ao salvar. */ }
  }
  const inputs = fields[record ? entry.record_type : table] || [];
  useEffect(() => { dialog.current.showModal(); }, []);

  async function save(event) {
    event.preventDefault();
    if (busy || !window.confirm('Salvar as alterações neste lançamento?')) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      let values = Object.fromEntries(inputs.map(([key]) => [key, form.get(key)?.trim() || '']));
      if (table === 'vacancies') values.quantity = Number(values.quantity);
      if (table === 'hr_processes') {
        values.due_date ||= null;
        values.process_type = form.get('process_type');
        if (values.process_type === 'termination') values.vacancy_id = null;
      }
      if (table === 'message_templates') values.variables = form.has('usesDate') ? ['nome', 'data'] : ['nome'];
      if (record) {
        values = {
          title: form.get('title').trim(),
          metadata: { ...entry.metadata, description: form.get('description').trim() },
        };
        if (credential) {
          values.metadata.login = form.get('username').trim();
          values.metadata.other = form.get('other').trim();
          const password = form.get('password');
          if (password) {
            const master = form.get('master');
            if (!master) throw new Error('Informe a senha mestra para criptografar a nova senha.');
            values.encrypted_payload = await encryptValue(password, master);
          }
        } else {
          values.content = inputs.length ? JSON.stringify({
            ...content, ...Object.fromEntries(inputs.map(([key]) => [key, form.get(key).trim()])),
          }) : form.get('content');
        }
      }
      await onSave(values);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <dialog className="entry-editor" ref={dialog}
    aria-labelledby="entry-editor-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={save}>
      <header><h2 id="entry-editor-title">Editar lançamento</h2>
        <button type="button" className="secondary" disabled={busy} aria-label="Fechar edição" onClick={onClose}><X size={18}/></button>
      </header>
      <fieldset disabled={busy}>
        {record && <>
          <label>Identificação<input name="title" defaultValue={entry.title} required/></label>
          <label>Descrição complementar<input name="description" defaultValue={entry.metadata?.description || ''}/></label>
        </>}
        {inputs.map(([key, label, type = 'text'], index) => <label key={key}>{label}
          {type === 'textarea'
            ? <textarea name={key} rows={5} required={!record && index === 0} defaultValue={entry[key] || ''}/>
            : <input name={key} type={type} min={type === 'number' ? 1 : undefined} step={type === 'number' ? 1 : undefined}
                required={table === 'vacancies' && key === 'quantity' || !record && index === 0}
                defaultValue={(record ? content?.[key] : entry[key]) ?? ''}/>}
        </label>)}
        {record && !credential && !inputs.length && <label>Conteúdo<textarea name="content" rows={6} defaultValue={entry.content || ''}/></label>}
        {credential && <>
          <label>Login<input name="username" defaultValue={entry.metadata?.login || ''}/></label>
          <label>Outros dados<input name="other" defaultValue={entry.metadata?.other || ''}/></label>
          <label>Nova senha<input name="password" type="password" autoComplete="new-password"/></label>
          <label>Senha mestra para a nova senha<input name="master" type="password" autoComplete="off"/></label>
          <p>Preencha a nova senha e a senha mestra somente quando quiser trocar a senha armazenada.</p>
        </>}
        {table === 'message_templates' && <label>
          <input type="checkbox" name="usesDate" defaultChecked={entry.variables?.includes('data')}/> Usar variável de data
        </label>}
        {table === 'hr_processes' && <label>Tipo<select name="process_type" defaultValue={entry.process_type}>
          <option value="admission">Admissão</option><option value="termination">Rescisão</option>
        </select></label>}
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <footer>
        <button type="button" className="secondary" disabled={busy} onClick={async () => {
          if (busy) return;
          setBusy(true);
          try { if (await onDelete()) onClose(); } catch (err) { setError(err.message); }
          finally { setBusy(false); }
        }}>Excluir</button>
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button>
      </footer>
    </form>
  </dialog>;
}
