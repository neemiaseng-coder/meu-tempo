import React, { useEffect, useState } from 'react';
import { NotebookPen } from 'lucide-react';
export default function QuickNotes({ userId }) {
  const key = 'meu-tempo-notes-' + userId;
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Salvo automaticamente neste navegador.');
  useEffect(() => { try { setText(localStorage.getItem(key) || ''); } catch { setStatus('Armazenamento indisponível neste navegador.'); } }, [key]);
  return <section className="social-notes" aria-labelledby="quick-notes-title">
    <h2 id="quick-notes-title"><NotebookPen size={20}/> Anotações</h2>
    <label className="sr-only" htmlFor="quick-notes">Suas anotações livres</label>
    <textarea id="quick-notes" rows={7} value={text} placeholder="Uma ideia, um detalhe, algo para lembrar…" onChange={event => {
      const next = event.target.value; setText(next);
      try { localStorage.setItem(key, next); setStatus('Salvo neste navegador.'); } catch { setStatus('Não foi possível salvar. Copie sua anotação para preservá-la.'); }
    }}/><small role="status">{status}</small>
  </section>;
}
