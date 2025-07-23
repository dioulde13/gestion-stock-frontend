'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './dashboard.module.css';
import ProtectedRoute from './components/ProtectedRoute';

type Statistiques = {
  ventesTotal: number;
  achatsTotal: number;
  beneficeTotal: number;
  produitsEnStock: number;
  rupturesStock: number;
  alertesStock: number;
  valeurStock: number;
  valeurTotalVendu: number;
  valeurTotalAchat: number;
  beneficeToatal: number;
};

const defaultStats: Statistiques = {
  ventesTotal: 0,
  achatsTotal: 0,
  beneficeTotal: 0,
  produitsEnStock: 0,
  rupturesStock: 0,
  alertesStock: 0,
  valeurStock: 0,
  valeurTotalVendu: 0,
  valeurTotalAchat: 0,
  beneficeToatal: 0,
};

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<Statistiques>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');

  useEffect(() => {
    setHydrated(true);

    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), 1);
    const fin = new Date();

    setDateDebut(debut.toISOString().split('T')[0]);
    setDateFin(fin.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateDebut && dateFin) {
      fetchStats(dateDebut, dateFin);
    }
  }, [dateDebut, dateFin]);

  const fetchStats = async (start: string, end: string) => {
    setLoading(true);
    setError(null);

    try {
      const statsRes = await fetch(
        `http://localhost:3000/api/dashboard/statistique?dateDebut=${start}&dateFin=${end}`
      );
      if (!statsRes.ok) throw new Error('Erreur API Statistiques');
      const statData = await statsRes.json();

      setStats({ ...defaultStats, ...statData });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) return null;
  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;
  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Erreur : {error}</p>;

  return (
    <ProtectedRoute>
      <div className={styles.dateFilterContainer}>
        <div className={styles.dateInputGroup}>
          <label htmlFor="dateDebut">Date début</label>
          <input
            id="dateDebut"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
        </div>
        <div className={styles.dateInputGroup}>
          <label htmlFor="dateFin">Date fin</label>
          <input
            id="dateFin"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
        </div>
      </div>


      <div className={styles.cardGrid}>
        <StatCard label="Valeur total de vente" value={stats.ventesTotal} color="green" />
        <StatCard label="Valeur total achat" value={stats.achatsTotal} color="yellow" />
        <StatCard label="Bénéfice total" value={stats.beneficeTotal} color="purple" />
        <StatCard label="Produits en stock" value={stats.produitsEnStock} unit="articles" color="blue" />
        <StatCard label="Ruptures de stock" value={stats.rupturesStock} unit="articles" color="red" />
        <StatCard label="Alertes Stock Min" value={stats.alertesStock} unit="alertes" color="orange" />
        <StatCard label="Valeur du stock" value={stats.valeurStock} color="gray" />
        <StatCard label="Solde du caisse" value={stats.valeurStock + stats.beneficeTotal} color="gray" />
      </div>
    </ProtectedRoute>
  );
}

type StatCardProps = {
  label: string;
  value: number | null | undefined;
  color: string;
  unit?: string;
};

function StatCard({ label, value, color, unit }: StatCardProps) {
  const displayedValue = typeof value === 'number' ? value.toLocaleString() : 'N/A';

  return (
    <div className={styles.card}>
      <div className={styles.cardRow}>
        <div className={`${styles.iconBox} ${styles[color as keyof typeof styles]}`}>
          <svg
            className={styles.svgIcon}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8v4l3 3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3>{label}</h3>
          <p>
            {displayedValue} {unit ?? 'GNF'}
          </p>
        </div>
      </div>
    </div>
  );
}
