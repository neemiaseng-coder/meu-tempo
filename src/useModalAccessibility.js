import { useEffect } from 'react';

// Mantém os formulários legados com o mesmo comportamento de teclado dos dialogs nativos.
export default function useModalAccessibility() {
  useEffect(() => {
    let active = null, previousFocus = null;
    const focusable = root => [...root.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')]
      .filter(element => !element.disabled && element.getClientRects().length);
    const sync = () => {
      const overlay = [...document.querySelectorAll('.overlay')].at(-1) || null;
      if (overlay === active) return;
      if (!overlay) { const previous = previousFocus; active = null; previousFocus = null; if (previous?.isConnected) previous.focus(); return; }
      if (!active) previousFocus = document.activeElement;
      active = overlay;
      const panel = overlay.querySelector('.modal');
      if (panel) {
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
        if (!panel.hasAttribute('aria-label') && !panel.hasAttribute('aria-labelledby')) panel.setAttribute('aria-label', panel.querySelector('h2')?.textContent || 'Formulário');
        (focusable(panel)[0] || panel).focus();
      }
    };
    const onKey = event => {
      if (!active || document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); active.click(); }
      if (event.key === 'Tab') {
        const targets = focusable(active); const first = targets[0], last = targets.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    const observer = new MutationObserver(sync); observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', onKey); sync();
    return () => { observer.disconnect(); document.removeEventListener('keydown', onKey); };
  }, []);
}
