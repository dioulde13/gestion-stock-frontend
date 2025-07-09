'use client';

import { useEffect, useState } from 'react';

type LigneVente = {
  id: number;
  produitId: number;
  quantite: number;
  prix_vente: number;
};

type Vente = {
  id: number;
  total: number;
  lignes: LigneVente[];
};

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Formulaire création simplifié : 1 ligne de vente pour l’exemple
  const [produitId, setProduitId] = useState<number>(0);
  const [quantite, setQuantite] = useState<number>(1);
  const [prixVente, setPrixVente] = useState<number>(0);

  // Charger les ventes à l’ouverture (exemple simple)
  useEffect(() => {
    fetchVentes();
  }, []);

  const fetchVentes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/vente/liste');
      if (!res.ok) throw new Error('Erreur lors du chargement des ventes');
      const data = await res.json();
      setVentes(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Créer une vente
  const creerVente = async () => {
    if (produitId <= 0 || quantite <= 0 || prixVente <= 0) {
      alert('Merci de remplir correctement tous les champs');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('http://localhost:3000/api/vente/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignes: [{ produitId, quantite, prix_vente: prixVente }],
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la création de la vente');
      alert('Vente créée avec succès');
      setProduitId(0);
      setQuantite(1);
      setPrixVente(0);
      fetchVentes();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  // Supprimer une vente
  const supprimerVente = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette vente ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:3000/api/vente/supprimer/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      alert('Vente supprimée');
      fetchVentes();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Gestion des ventes</h1>

      <section style={{ marginBottom: 20 }}>
        <h2>Créer une vente</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            type="number"
            placeholder="Produit ID"
            value={produitId || ''}
            onChange={(e) => setProduitId(Number(e.target.value))}
            style={{ flex: 1, padding: 8 }}
          />
          <input
            type="number"
            placeholder="Quantité"
            value={quantite}
            min={1}
            onChange={(e) => setQuantite(Number(e.target.value))}
            style={{ flex: 1, padding: 8 }}
          />
          <input
            type="number"
            placeholder="Prix vente"
            value={prixVente || ''}
            min={0}
            step="0.01"
            onChange={(e) => setPrixVente(Number(e.target.value))}
            style={{ flex: 1, padding: 8 }}
          />
        </div>
        <button onClick={creerVente} disabled={creating} style={{ padding: '10px 20px' }}>
          {creating ? 'Création...' : 'Créer la vente'}
        </button>
      </section>

      <section>
        <h2>Liste des ventes</h2>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Erreur : {error}</p>
        ) : ventes.length === 0 ? (
          <p>Aucune vente trouvée.</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 10,
            }}
          >
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>ID Vente</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Total</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ventes.map((vente) => (
                <tr key={vente.id}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{vente.id}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{vente.total.toFixed(2)} GNF</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    <button
                      onClick={() => supprimerVente(vente.id)}
                      disabled={deletingId === vente.id}
                      style={{ padding: '5px 10px' }}
                    >
                      {deletingId === vente.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
