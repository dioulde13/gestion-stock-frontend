'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './dashboard.module.css';

type Produit = {
  id: number;
  nom: string;
  prix_vente: number;
  prix_achat: number;
  stock_actuel: number;
};

type LigneVente = {
  id?: number;
  produitId: number;
  quantite: number;
  prix_vente: number;
  Produit?: Produit;
};

type Vente = {
  id: number;
  total: number;
  LigneVentes: LigneVente[];
};

type Statistiques = {
  ventesDuJour: number;
  totalAchats: number;
  beneficeDuJour: number;
  produitsEnStock: number;
  rupturesStock: number;
  alertesStock: number;
  valeurStock: number;
  valeurTotalVendu: number;
  valeurTotalAchat: number;
  beneficeToatal: number;
};

const defaultStats: Statistiques = {
  ventesDuJour: 0,
  totalAchats: 0,
  beneficeDuJour: 0,
  produitsEnStock: 0,
  rupturesStock: 0,
  alertesStock: 0,
  valeurStock: 0,
  valeurTotalVendu: 0,
  valeurTotalAchat: 0,
  beneficeToatal: 0,
};

export default function Home() {
  const [hydrated, setHydrated] = useState(false); // Hydratation côté client
  const [stats, setStats] = useState<Statistiques>(defaultStats);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalAchat, setTotalAchat] = useState<number | null>(null);
  const [totalVente, setTotalVente] = useState<number | null>(null);

  useEffect(() => {
    setHydrated(true);

    setLoading(true);
    setError(null);

    Promise.all([
      fetch('http://localhost:3000/api/dashboard/statistique').then((res) => {
        if (!res.ok) throw new Error('Erreur API Statistiques');
        return res.json();
      }),
      fetch('http://localhost:3000/api/vente/liste').then((res) => {
        if (!res.ok) throw new Error('Erreur API Ventes');
        return res.json();
      }),
    ])
      .then(([statData, ventesData]) => {
        setStats({
          ...defaultStats,
          ...statData, // on sécurise les valeurs
        });
        setVentes(ventesData);

        // Calcul total achats et total ventes
        let totalAchats = 0;
        let totalVentes = 0;
        ventesData.forEach((vente: Vente) => {
          vente.LigneVentes.forEach((ligne) => {
            totalAchats += ligne.quantite * (ligne.Produit?.prix_achat ?? 0);
            totalVentes += ligne.quantite * ligne.prix_vente;
          });
        });
    
        setTotalAchat(totalAchats);
        setTotalVente(totalVentes);

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);


  // Calcul marge totale (bénéfice)
  const margeTotale = useMemo(() => {
    if (totalAchat !== null && totalVente !== null) {
      return totalVente - totalAchat;
    }
    return null;
  }, [totalAchat, totalVente]);

  if (!hydrated) return null; // Pas de rendu côté serveur pour éviter l'erreur d'hydratation
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
      <StatCard label="Valeur total achat" value={totalAchat} color="gray" />
      <StatCard label="Valeur total de vente" value={totalVente} color="gray" />
      {margeTotale !== null && (
        <StatCard label="Valeur du bénéfice" value={margeTotale} color="teal" />
      )}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number | null | undefined;
  color: string;
  unit?: string;
};

function StatCard({ label, value, color, unit }: StatCardProps) {
  const displayedValue =
    typeof value === 'number' ? value.toLocaleString() : 'N/A';

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
