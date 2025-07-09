'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

type Statistiques = {
  ventesDuJour: number;
  totalAchats: number;
  beneficeDuJour: number;
  produitsEnStock: number;
  rupturesStock: number;
  alertesStock: number;
  valeurStock: number;
};

const defaultStats: Statistiques = {
  ventesDuJour: 0,
  totalAchats: 0,
  beneficeDuJour: 0,
  produitsEnStock: 0,
  rupturesStock: 0,
  alertesStock: 0,
  valeurStock: 0,
};

export default function Home() {
  const [hydrated, setHydrated] = useState(false); // Hydratation
  const [stats, setStats] = useState<Statistiques>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true); // Le composant est hydraté côté client

    fetch('http://localhost:3000/api/dashboard/statistique')
      .then((res) => {
        if (!res.ok) throw new Error('Erreur API');
        return res.json();
      })
      .then((data: Statistiques) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (!hydrated) return null; // Empêche le rendu avant l'hydratation
  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;
  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Erreur : {error}</p>;

  return (
    <div className={styles.cardGrid}>
      <StatCard label="Ventes du jour" value={stats.ventesDuJour} color="green" />
      <StatCard label="Total Achats" value={stats.totalAchats} color="yellow" />
      <StatCard label="Bénéfice du jour" value={stats.beneficeDuJour} color="purple" />
      <StatCard label="Produits en stock" value={stats.produitsEnStock} unit="articles" color="blue" />
      <StatCard label="Ruptures de stock" value={stats.rupturesStock} unit="articles" color="red" />
      <StatCard label="Alertes Stock Min" value={stats.alertesStock} unit="alertes" color="orange" />
      <StatCard label="Valeur du stock" value={stats.valeurStock} color="gray" />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  color: string;
  unit?: string;
};

function StatCard({ label, value, color, unit }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardRow}>
        <div className={`${styles.iconBox} ${styles[color as keyof typeof styles]}`}>
          <svg className={styles.svgIcon} xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8v4l3 3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3>{label}</h3>
          <p>{value.toLocaleString()} {unit ?? 'GNF'}</p>
        </div>
      </div>
    </div>
  );
}
