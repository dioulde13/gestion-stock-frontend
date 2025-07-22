'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('http://localhost:3000/api/utilisateur/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mot_de_passe }),
    });

    const data = await res.json();

    if (res.ok) {
      document.cookie = `token=${data.token}; path=/; max-age=7200`; // 2h
      window.location.href = '/';
      // router.refresh();
      router.push('/');
    } else {
      setErreur(data.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Connexion</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={mot_de_passe}
          onChange={e => setMotDePasse(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
        {erreur && <p className="erreur">{erreur}</p>}
      </form>
    </div>
  );
}
