import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Pencil, X } from 'lucide-react';

const labels = {
  razao: 'Razão social', fantasia: 'Nome fantasia', cnpj: 'CNPJ', ie: 'Inscrição estadual',
  cep: 'CEP', street: 'Rua', number: 'Número', complement: 'Complemento', district: 'Bairro',
  city: 'Cidade', state: 'Estado', responsible: 'Responsável', name: 'Nome',
  phone: 'Telefone', email: 'E-mail',
};

export default function RecordViewer({ record, readPassword, onEdit, onClose }) {
  const dialog = useRef(null);
  const [password, setPassword] = useState(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [master, setMaster] = useState('');
  const credential = record.record_type === 'credential';
  const legacy = credential && record.metadata?.credential_encryption !== 'account-v1';
  let fields = [];
  if (!credential) {
    try {
      const content = JSON.parse(record.content || '{}');
      fields = content && typeof content === 'object'
        ? Object.entries(content).filter(([, value]) => value !== null && value !== undefined && value !== '')
        : [['content', content]];
    } catch { fields = [['content', record.content]]; }
  }
  useEffect(() => { dialog.current.showModal(); }, []);

  async function reveal() {
    if (visible) { setVisible(false); return; }
    if (password !== null) { setVisible(true); return; }
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      setPassword(await readPassword(master));
      setVisible(true);
      setMaster('');
    } catch {
      setError(legacy ? 'Não foi possível abrir a senha antiga. Confira a senha mestra.' : 'Não foi possível exibir a senha. Tente novamente.');
    } finally { setBusy(false); }
  }

  return <dialog className="entry-editor record-viewer" ref={dialog} aria-labelledby="record-viewer-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="record-viewer-body">
      <header><h2 id="record-viewer-title">{record.title}</h2>
        <button className="secondary" aria-label="Fechar cadastro" onClick={onClose}><X size={18}/></button>
      </header>
      {record.metadata?.description && <p className="record-viewer-description">{record.metadata.description}</p>}
      <dl>
        {credential ? <>
          <dt>Login</dt><dd>{record.metadata?.login || 'Não informado'}</dd>
          <dt>Senha</dt><dd className="record-viewer-password">
            <span>{visible ? password : '••••••••'}</span>
            <button className="secondary" disabled={busy} onClick={reveal}>
              {visible ? <EyeOff size={16}/> : <Eye size={16}/>}
              {busy ? 'Abrindo…' : visible ? 'Ocultar' : 'Mostrar'}
            </button>
          </dd>
          {record.metadata?.other && <><dt>Outros dados</dt><dd>{record.metadata.other}</dd></>}
        </> : fields.map(([key, value]) => <React.Fragment key={key}>
          <dt>{labels[key] || (key === 'content' ? 'Informações' : key)}</dt>
          <dd>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</dd>
        </React.Fragment>)}
      </dl>
      {legacy && password === null && <label className="record-viewer-unlock">
        Senha mestra do cadastro antigo
        <input type="password" value={master} onChange={event => setMaster(event.target.value)} autoComplete="off"/>
        <small>Necessária para ler a senha antiga. Para substituí-la, use Editar.</small>
      </label>}
      {!credential && !fields.length && <p>Nenhuma informação complementar.</p>}
      {error && <p role="alert">{error}</p>}
      <footer>
        <button className="secondary" onClick={onEdit}><Pencil size={16}/> Editar</button>
        <button className="primary" onClick={onClose}>Fechar</button>
      </footer>
    </div>
  </dialog>;
}
