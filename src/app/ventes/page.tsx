'use client';

import { useEffect, useState, useMemo } from 'react';

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
  prix_achat: number;
  prix_vente: number;
  Produit?: Produit;
};

type Vente = {
  id: number;
  total: number;
  LigneVentes: LigneVente[];
};

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [lignesVente, setLignesVente] = useState<LigneVente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ligneTemp, setLigneTemp] = useState({
    produitId: '',
    quantite: '1',
    prix_achat: '',
    prix_vente: '',
  });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dataProduit, setDataProduit] = useState<Produit[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchVentes();
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/produit/liste');
      if (!res.ok) throw new Error('Erreur lors du chargement des produits');
      const produit: Produit[] = await res.json();
      setDataProduit(produit);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const [totalAchat, setTotalAchat] = useState<number | null>(null);
  const [totalVente, setTotalVente] = useState<number | null>(null);

  const fetchVentes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/vente/liste");
      if (!res.ok) throw new Error("Erreur lors du chargement des ventes");

      const data: Vente[] = await res.json();
      setVentes(data);
      // console.log(data);
      // Calcul total achats
      let totalAchats = 0;
      data.forEach((vente) => {
        vente.LigneVentes.forEach((ligne) => {
          totalAchats += ligne.quantite * (ligne?.prix_achat ?? 0);
        });
      });

      // Calcul total ventes
      let totalVentes = 0;
      data.forEach((vente) => {
        vente.LigneVentes.forEach((ligne) => {
          totalVentes += ligne.quantite * ligne.prix_vente;
        });
      });

      setTotalAchat(totalAchats);
      setTotalVente(totalVentes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Calcul marge totale
  const margeTotale = useMemo(() => {
    if (totalAchat !== null && totalVente !== null) {
      return totalVente - totalAchat;
    }
    return null;
  }, [totalAchat, totalVente]);



  const creerVente = async () => {
    if (lignesVente.length === 0) {
      alert('Ajoutez au moins une ligne de vente.');
      return;
    }
    const lignesValides = lignesVente.every(
      (ligne) =>
        ligne.produitId > 0 && ligne.quantite > 0 && ligne.prix_vente > 0
    );
    if (!lignesValides) {
      alert('Veuillez remplir correctement toutes les lignes de vente.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('http://localhost:3000/api/vente/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lignes: lignesVente }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur inconnue');
      }
      alert('Vente créée avec succès');
      setLignesVente([]);
      fetchVentes();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

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

  const ouvrirModal = (index?: number) => {
    if (typeof index === 'number') {
      const ligne = lignesVente[index];
      setLigneTemp({
        produitId: ligne.produitId.toString(),
        quantite: ligne.quantite.toString(),
        prix_achat: ligne.prix_achat.toString(),
        prix_vente: ligne.prix_vente.toString(),
      });
      setEditingIndex(index);
    } else {
      setLigneTemp({ produitId: '', quantite: '1', prix_achat: '', prix_vente: '' });
      setEditingIndex(null);
    }
    setModalOpen(true);
  };

  const fermerModal = () => {
    setModalOpen(false);
    setLigneTemp({ produitId: '', quantite: '1', prix_achat: '', prix_vente: '' });
    setEditingIndex(null);
  };

  const confirmerLigne = () => {
    const produitIdNum = Number(ligneTemp.produitId);
    const quantiteNum = Number(ligneTemp.quantite);
    const prixAchatNum = Number(ligneTemp.prix_achat);
    const prixVenteNum = Number(ligneTemp.prix_vente);

    if (!produitIdNum || !quantiteNum || !prixVenteNum) {
      alert('Veuillez remplir tous les champs avec des valeurs valides.');
      return;
    }

    const nouvelleLigne = {
      produitId: produitIdNum,
      quantite: quantiteNum,
      prix_achat: prixAchatNum,
      prix_vente: prixVenteNum,
    };

    console.log(nouvelleLigne);

    if (editingIndex !== null) {
      const updated = [...lignesVente];
      updated[editingIndex] = nouvelleLigne;
      setLignesVente(updated);
    } else {
      setLignesVente([...lignesVente, nouvelleLigne]);
    }

    fermerModal();
  };

  const supprimerLigneTemp = (index: number) => {
    const updated = lignesVente.filter((_, i) => i !== index);
    setLignesVente(updated);
  };

  if (!mounted) return null;

   const formatPrix = (prix: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(prix);
  };

  return (
    <div style={{ margin: 'auto', padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Gestion des ventes</h1>

      {/* section d'ajout de ligne */}
      <section style={{ background: '#f4f4f4', padding: 20, borderRadius: 8, marginBottom: 30 }}>
        <button onClick={() => ouvrirModal()}
          style={{
            padding: '10px 20px', backgroundColor: '#4caf50', color: '#fff',
            border: 'none', borderRadius: 4, marginBottom: 10,
            cursor: creating ? 'not-allowed' : 'pointer'
          }}>
          + Ajouter une ligne
        </button>

        {/* tableau lignes de vente temporaires */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <thead>
            <tr style={{ backgroundColor: ' #04AA6D' }}>
              <th>ID Produit</th>
              <th>Quantité</th>
              <th>Prix (GNF)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lignesVente.map((ligne, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center', border: '1px solid #ddd', padding: '8px' }}>{ligne.produitId}</td>
                <td style={{ textAlign: 'center', border: '1px solid #ddd', padding: '8px' }}>{ligne.quantite}</td>
                <td style={{ textAlign: 'center', border: '1px solid #ddd', padding: '8px' }}>{formatPrix(ligne.prix_vente)}</td>
                <td style={{ textAlign: 'center', border: '1px solid #ddd', padding: '8px' }}>
                  <button onClick={() => ouvrirModal(i)} style={{ marginRight: 8, backgroundColor: '#2196f3', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4 }}>Modifier</button>
                  <button onClick={() => supprimerLigneTemp(i)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4 }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={creerVente}
          disabled={creating}
          style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: creating ? 'not-allowed' : 'pointer' }}
        >
          {creating ? 'Création...' : 'Créer la vente'}
        </button>
      </section>

      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p className="text-red-600">Erreur : {error}</p>
      ) : ventes.length === 0 ? (
        <p>Aucune vente trouvée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="px-4 py-2 text-left">Actions</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventes.map((vente, i) => (
                <>
                  <tr key={vente.id} className="border-b">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setOpenIndex(openIndex === i ? null : i)}
                          className="text-xl hover:text-green-600"
                          title="Afficher les détails"
                        >
                          {openIndex === i ? '🔼' : '🔽'}
                        </button>
                        <button
                          onClick={() => supprimerVente(vente.id)}
                          disabled={deletingId === vente.id}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {deletingId === vente.id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                        {/* {totalAchat?.toLocaleString()} GNF
                      : {totalVente?.toLocaleString()} GNF
                       : {margeTotale?.toLocaleString()} GNF */}
                      {vente.total?.toLocaleString()} GNF
                    </td>
                  </tr>

                  {openIndex === i && (
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-4">
                        <table className="w-full text-sm border border-gray-300">
                          <thead className="bg-green-100">
                            <tr>
                              <th className="px-3 py-2 border">Produit</th>
                              <th className="px-3 py-2 border">Quantité</th>
                              <th className="px-3 py-2 border">Prix Achat</th>
                              <th className="px-3 py-2 border">Prix Vente</th>
                              <th className="px-3 py-2 border">total achat</th>
                              <th className="px-3 py-2 border">total Vente</th>
                              <th className="px-3 py-2 border">Bénéfice</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vente.LigneVentes.map((ligne, j) => (
                              <tr key={j} className="border-t">
                                <td className="px-3 py-2 text-center border">
                                  {ligne.Produit?.nom || 'Produit inconnu'}
                                </td>
                                <td className="px-3 py-2 text-center border">
                                  {ligne.quantite}
                                </td>
                                <td className="px-3 py-2 text-center border">
                                  {ligne?.prix_achat?.toLocaleString()} GNF
                                </td>
                                <td className="px-3 py-2 text-center border">
                                  {ligne.prix_vente?.toLocaleString()} GNF
                                </td>
                                <td className="px-3 py-2 text-center border">
                                  {formatPrix(ligne.quantite * (ligne?.prix_achat ?? 0))}
                                </td>
                                <td className="px-3 py-2 text-center border">
                                  {formatPrix(ligne.quantite * (ligne.prix_vente ?? 0))}
                                </td>
                                <td className="px-3 py-2 text-center border">
                                  {formatPrix((ligne.quantite * (ligne.prix_vente ?? 0)) - (ligne.quantite * (ligne?.prix_achat ?? 0)))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* modal */}
      {modalOpen && (
        <div onClick={fermerModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: 20, borderRadius: 8, width: '90%', maxWidth: 400 }}>
            <h3 style={{ marginBottom: 15, fontWeight: 'bold', fontSize: '1.2rem' }}>{editingIndex !== null ? 'Modifier la ligne' : 'Ajouter une ligne'}</h3>
            <label style={{ display: 'block', marginBottom: 8 }}>Produit :</label>
            <select
              value={ligneTemp.produitId}
              onChange={(e) => setLigneTemp({ ...ligneTemp, produitId: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: 6, marginBottom: 15, backgroundColor: '#f9f9f9', fontSize: '1rem' }}
            >
              <option value="">-- Sélectionnez un produit --</option>
              {dataProduit.map((prod) => (
                <option key={prod.id} value={prod.id}>{prod.nom} - {prod.prix_achat} - {prod.prix_vente} - {prod.stock_actuel}</option>
              ))}
            </select>
            <label style={{ display: 'block', marginBottom: 8 }}>Quantité :</label>
            <input type="number" placeholder="Quantité" min={1} value={ligneTemp.quantite} onChange={(e) => setLigneTemp({ ...ligneTemp, quantite: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, marginBottom: 15, fontSize: '1rem' }} />
            <label style={{ display: 'block', marginBottom: 8 }}>Prix de vente :</label>
            <input type="number" placeholder="Prix de vente" min={0} step="0.01" value={ligneTemp.prix_vente} onChange={(e) => setLigneTemp({ ...ligneTemp, prix_vente: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, marginBottom: 20, fontSize: '1rem' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={confirmerLigne} style={{ background: '#4caf50', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontSize: '1rem' }}>Valider</button>
              <button onClick={fermerModal} style={{ background: '#ccc', border: 'none', padding: '10px 20px', borderRadius: 6, fontSize: '1rem' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
