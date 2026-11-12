import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

export function loginError(error) {
  switch (error?.code) {
    case 'invalid_credentials': return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    case 'email_not_confirmed': return 'Confirme seu e-mail antes de entrar.';
    case 'over_request_rate_limit': return 'Muitas tentativas. Aguarde um momento antes de tentar novamente.';
    default: return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }
}

export default function Login({ client, connectionError }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError('');
    setPending(true);
    let timer;
    try {
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Login timeout')), 15000);
      });
      const result = await Promise.race([
        client.auth.signInWithPassword({
          email: form.get('email').trim().toLowerCase(),
          password: form.get('password'),
        }),
        timeout,
      ]);
      if (result.error) setError(loginError(result.error));
    } catch (err) {
      setError(loginError(err));
    } finally {
      clearTimeout(timer);
      setPending(false);
    }
  }

  return <main className="login">
    <div className="login-card">
      <div className="brand-mark"><Leaf/></div>
      <p className="eyebrow">SEU ESPAÇO PESSOAL</p>
      <h1>Bem-vindo ao<br/><em>Meu Tempo.</em></h1>
      <p className="muted">Entre para organizar suas prioridades e cuidar do seu tempo.</p>
      <form onSubmit={signIn} aria-busy={pending}>
        <label>E-mail<input name="email" type="email" autoComplete="username" required placeholder="seu@email.com"/></label>
        <label>Senha<input name="password" type={showPassword ? 'text' : 'password'}
          autoComplete="current-password" required placeholder="Sua senha"/></label>
        <button className="login-password-toggle" type="button" onClick={() => setShowPassword(value => !value)}>
          {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        </button>
        {(error || connectionError) && <p className="login-error" role="alert">{error || connectionError}</p>}
        <button className="primary full" type="submit" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <small>O acesso é individual e protegido pelo Supabase.</small>
    </div>
  </main>;
}
