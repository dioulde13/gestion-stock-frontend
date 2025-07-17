'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import styles from './mouvementStock.module.css';
import UtilisateurTable from '../utilisateurs/page';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type Utilisateur = {
  id: number;
  nom: string;
};


type Produit = {
  id: number;
  nom: string;
  prix_vente: number;
  prix_achat: number;
  stock_actuel: number;
};

type TypeMvt = {
  id: number;
  type: string;
};

type MouvementStock = {
  id: number;
  quantite: number;
  motif: string;
  Produit?: Produit;
  TypeMvt?: TypeMvt;
  Utilisateur?: Utilisateur;
};

export default function MouvementStockTable() {
  const [dataTypeMvt, setDataTypeMvt] = useState<TypeMvt[]>([]);
  const [dataProduit, setDataProduit] = useState<Produit[]>([]);
  const [dataUtilisateur, setDataUtilisateur] = useState<Utilisateur[]>([]);
  const [data, setData] = useState<MouvementStock[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [modalMouvementStock, setModalMouvementStock] = useState<MouvementStock | null>(null);

  // Form state
  const [formMotif, setFormMotif] = useState('');
  const [formQuantite, setFormQuantite] = useState<number | null>(null);
  const [formTypeId, setFormTypeId] = useState<number | null>(null);
  const [formProduitId, setFormProduitId] = useState<number | null>(null);
  const [formUtilisateurId, setFormUtilisateurId] = useState<number | null>(null);


  // Loading submit pour ajout/modif
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchMouvementStock();
    fetchTypeMvt();
    fetchProduit();
    fetchUtilisateur();
  }, []);


   const fetchUtilisateur = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/utilisateur/liste');
      if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const utilisateur: Utilisateur[] = await res.json();
      setDataUtilisateur(utilisateur);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const fetchMouvementStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/mouvementStock/liste');
      if (!res.ok) {
        const errorData = await res.json(); // On récupère l'objet JSON
        throw new Error(errorData.message.message);
      }
      const mouvementStock: MouvementStock[] = await res.json();
      setData(mouvementStock);
      console.log(mouvementStock);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const fetchTypeMvt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/typeMvtStock/liste');
      if (!res.ok) throw new Error('Erreur lors du chargement des type');
      const typeMvtStock: TypeMvt[] = await res.json();
      setDataTypeMvt(typeMvtStock);
      console.log(typeMvtStock);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/produit/liste');
      if (!res.ok) throw new Error('Erreur lors du chargement des produits');
      const produit: Produit[] = await res.json();
      setDataProduit(produit);
      console.log(produit);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Notification helper
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredData = data.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.motif && p.motif.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export CSV
  const exportCSV = () => {
    const csvRows = [
      ['ID', 'Motif', 'Quantite', 'Produit', 'Type', 'Utilisateur'],
      ...filteredData.map((p) => [
        p.id,
        p.motif,
        p.quantite,
        p.Produit?.nom ?? '',
        p.TypeMvt?.type ?? '',
        p.Utilisateur?.nom ?? '',
      ]),
    ];
    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'produits.csv';
    link.click();
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Liste des mouvements Stock', 14, 10);
    doc.autoTable({
      head: [['ID', 'Motif', 'Quantite', 'Produit', 'Type', 'Utilisateur']],
      body: filteredData.map((p) => [
        p.id,
        p.motif,
        p.quantite,
        p.Produit?.nom ?? '',
        p.TypeMvt?.type ?? '',
        p.Utilisateur?.nom ?? '',
      ]),
      startY: 20,
      styles: { fontSize: 8 },
    });
    doc.save('produits.pdf');
  };

  const goToPage = (page: number) => {
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  const openModal = (type: 'edit' | 'delete' | 'add', mouvementStock?: MouvementStock) => {
    setModalType(type);
    setModalMouvementStock(mouvementStock || null);
    setModalOpen(true);

    if (type === 'edit' && mouvementStock) {
      setFormMotif(mouvementStock.motif);
      setFormQuantite(mouvementStock.quantite);
      setFormProduitId(mouvementStock.Produit?.id ?? null);
      setFormTypeId(mouvementStock.TypeMvt?.id ?? null);
      setFormTypeId(mouvementStock.Utilisateur?.id ?? null);
    } else if (type === 'add') {
      setFormMotif('');
      setFormQuantite(Number);
      setFormProduitId(null);
      setFormTypeId(null);
      setFormUtilisateurId(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalMouvementStock(null);
  };

  // DELETE produit
  const handleDelete = async () => {
    if (!modalMouvementStock) return;
    try {
      const res = await fetch(`http://localhost:3000/api/utilisateur/supprimer/${modalMouvementStock.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setData((prev) => prev.filter((p) => p.id !== modalMouvementStock.id));
      closeModal();
      fetchMouvementStock();
      showNotification('Mouvement Stock supprimé avec succès.');
      if ((currentPage - 1) * itemsPerPage >= filteredData.length - 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // PUT (modifier produit)
  const handleEdit = async () => {
    if (!modalMouvementStock) return;
    if (!formMotif) {
      alert('Merci de remplir les champs obligatoires (nom)');
      return;
    }
    try {
      setLoadingSubmit(true);
      const updatedProduit = {
        quantite: formQuantite,
        motif: formMotif,
        produitId: formProduitId,
        typeMvtId: formTypeId,
        utilisateurId: formUtilisateurId
      };
      const res = await fetch(`http://localhost:3000/api/mouvementStock/${modalMouvementStock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduit),
      });
      if (!res.ok) throw new Error('Erreur lors de la modification');
      const dataApi = await res.json();
      setData((prev) =>
        prev.map((p) => (p.id === modalMouvementStock.id ? dataApi.produit ?? dataApi : p))
      );
      closeModal();
      fetchMouvementStock();
      showNotification('Mouvement Stock modifié avec succès.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // POST (ajouter produit)
  const handleAdd = async () => {
    if (!formMotif) {
      alert('Merci de remplir les champs obligatoires (nom)');
      return;
    }
    try {
      setLoadingSubmit(true);
      const newProduit = {
        quantite: formQuantite,
        motif: formMotif,
        produitId: formProduitId,
        typeMvtId: formTypeId,
        utilisateurId: formUtilisateurId
      };
      console.log(newProduit);
      const res = await fetch('http://localhost:3000/api/mouvementStock/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduit),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const dataApi = await res.json();

      setData((prev) => [...prev, dataApi.produit ?? dataApi]);
      setSearch('');
      const newTotalItems = filteredData.length + 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      setCurrentPage(newTotalPages);
      closeModal();
      fetchMouvementStock();
      showNotification('Mouvement Stock  ajouté avec succès.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>La Liste des mouvements stocks</h1>

      {notification && (
        <div className={styles.notification}>
          {notification}
        </div>
      )}

      <div className={styles.actions}>
        <button onClick={exportCSV} className={styles.button}>
          Exporter CSV
        </button>
        <button onClick={exportPDF} className={styles.button}>
          Exporter PDF
        </button>

        <div>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <button
          onClick={() => openModal('add')}
          className={`${styles.button} ${styles.addButton}`}
          style={{ marginLeft: 'auto' }}
        >
          Ajouter
        </button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Erreur : {error}</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Motif</th>
                <th>Quantite</th>
                <th>Produit</th>
                <th>Type</th>
                <th>Utilisateur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((mouvementStock) => (
                  <tr key={mouvementStock.id}>
                    <td>{mouvementStock.id}</td>
                    <td>{mouvementStock.motif}</td>
                    <td>{mouvementStock.quantite}</td>
                    <td>{mouvementStock.Produit?.nom}</td>
                    <td>{mouvementStock.TypeMvt?.type}</td>
                    <td>{mouvementStock.Utilisateur?.nom}</td>
                    <td>
                      <button
                        title="Modifier"
                        className={styles.actionButton}
                        onClick={() => openModal('edit', mouvementStock)}
                      >
                        ✏️
                      </button>
                      <button
                        title="Supprimer"
                        className={styles.actionButton}
                        onClick={() => openModal('delete', mouvementStock)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center' }}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              Précédent
            </button>

            <span className={styles.pageInfo}>
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {modalType === 'edit' && modalMouvementStock && (
              <>
                <h2>Modifier utilisateur</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEdit();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Motif"
                    value={formMotif}
                    onChange={(e) => setFormMotif(e.target.value)}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />

                  <input
                    type="number"
                    placeholder="Quantite"
                    value={Number(formQuantite)}
                    onChange={(e) => setFormQuantite(Number(e.target.value))}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="ID Type"
                    value={formTypeId ?? ''}
                    onChange={(e) => setFormTypeId(Number(e.target.value))}
                    className={styles.modalInput}
                    min={1}
                    disabled={loadingSubmit}
                  />
                   <input
                    type="number"
                    placeholder="ID Produit"
                    value={formProduitId ?? ''}
                    onChange={(e) => setFormProduitId(Number(e.target.value))}
                    className={styles.modalInput}
                    min={1}
                    disabled={loadingSubmit}
                  />
                   <input
                    type="number"
                    placeholder="ID Utilisateur"
                    value={formUtilisateurId ?? ''}
                    onChange={(e) => setFormUtilisateurId(Number(e.target.value))}
                    className={styles.modalInput}
                    min={1}
                    disabled={loadingSubmit}
                  />
                  <div className={styles.modalActions}>
                    <button type="submit" className={styles.modalButton} disabled={loadingSubmit}>
                      {loadingSubmit ? 'Chargement...' : 'Confirmer'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className={styles.modalCloseButton}
                      disabled={loadingSubmit}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'delete' && modalMouvementStock && (
              <>
                <h2>Confirmer</h2>
                <p>
                  Veux-tu vraiment supprimer <strong>{modalMouvementStock.motif}</strong> ?
                </p>
                <div className={styles.modalActions}>
                  <button
                    onClick={handleDelete}
                    className={styles.modalButtonDelete}
                    disabled={loadingSubmit}
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={closeModal}
                    className={styles.modalCloseButton}
                    disabled={loadingSubmit}
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}

            {modalType === 'add' && (
              <>
                <h2>Ajouter un mouvements de stock</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdd();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Motif"
                    value={formMotif}
                    onChange={(e) => setFormMotif(e.target.value)}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />

                  <input
                    type="number"
                    placeholder="Quantite"
                    value={Number(formQuantite)}
                    onChange={(e) => setFormQuantite(Number(e.target.value))}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />
                  
                  <select
                    value={formTypeId ?? ''}
                    onChange={(e) => setFormTypeId(Number(e.target.value))}
                    className={styles.modalInput}
                  >
                    <option value="">-- Type --</option>
                    {dataTypeMvt.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.type}
                      </option>
                    ))}
                  </select>

                   <select
                    value={formProduitId ?? ''}
                    onChange={(e) => setFormProduitId(Number(e.target.value))}
                    className={styles.modalInput}
                  >
                    <option value="">-- Produit --</option>
                    {dataProduit.map((prod) => (
                    <option key={prod.id} value={prod.id}>{prod.nom} - {prod.prix_achat} - {prod.prix_vente} - {prod.stock_actuel}</option>
                    ))}
                  </select>

                   <select
                    value={formUtilisateurId ?? ''}
                    onChange={(e) => setFormUtilisateurId(Number(e.target.value))}
                    className={styles.modalInput}
                  >
                    <option value="">-- Utilisateur --</option>
                    {dataUtilisateur.map((utilisateur) => (
                      <option key={utilisateur.id} value={utilisateur.id}>
                        {utilisateur.nom}
                      </option>
                    ))}
                  </select>

                  <div className={styles.modalActions}>
                    <button type="submit" className={styles.modalButton} disabled={loadingSubmit}>
                      {loadingSubmit ? 'Chargement...' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className={styles.modalCloseButton}
                      disabled={loadingSubmit}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
