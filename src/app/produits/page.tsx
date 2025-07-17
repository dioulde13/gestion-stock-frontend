'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import styles from './produit.module.css';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type Categorie = {
  id: number;
  nom: string;
};

type Produit = {
  id: number;
  nom: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  stock_minimum: number;
  Categorie?: Categorie;
};

export default function ProduitTable() {
  const [dataCategorie, setDataCategorie] = useState<Categorie[]>([]);
  const [data, setData] = useState<Produit[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [modalProduit, setModalProduit] = useState<Produit | null>(null);

  // Form state
  const [formNom, setFormNom] = useState('');
  const [formPrixAchat, setFormPrixAchat] = useState<number | ''>('');
  const [formPrixVente, setFormPrixVente] = useState<number | ''>('');
  const [formStockActuel, setFormStockActuel] = useState<number | ''>('');
  const [formStockMinimum, setFormStockMinimum] = useState<number | ''>('');
  const [formCategorieId, setFormCategorieId] = useState<number | null>(null);
  const [formUtilisateurId, setFormUtilisateurId] = useState<number | null>(null);



  // Loading submit pour ajout/modif
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchProduits();
    fetchCategories();
  }, []);


  const fetchProduits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/produit/liste');
      if (!res.ok) {
        const errorData = await res.json(); // On récupère l'objet JSON
        throw new Error(errorData.message.message);
      }
      const produits: Produit[] = await res.json();
      setData(produits);
      console.log(produits);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/categorie/liste');
      if (!res.ok) throw new Error('Erreur lors du chargement des categories');
      const categorie: Categorie[] = await res.json();
      setDataCategorie(categorie);
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

  // Filtrage simple
  const filteredData = data.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(searchLower) ||
      (p.Categorie?.nom.toLowerCase().includes(searchLower) ?? false)
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
      ['ID', 'Nom', 'Prix Achat', 'Prix Vente', 'Stock Actuel', 'Stock Minimum', 'Catégorie', 'Utilisateur'],
      ...filteredData.map((p) => [
        p.id,
        p.nom,
        p.prix_achat,
        p.prix_vente,
        p.stock_actuel,
        p.stock_minimum,
        p.Categorie?.nom ?? '',
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
    doc.text('Liste des produits', 14, 10);
    doc.autoTable({
      head: [['ID', 'Nom', 'Prix Achat', 'Prix Vente', 'Stock Actuel', 'Stock Minimum', 'Catégorie', 'Utilisateur']],
      body: filteredData.map((p) => [
        p.id,
        p.nom,
        p.prix_achat,
        p.prix_vente,
        p.stock_actuel,
        p.stock_minimum,
        p.Categorie?.nom ?? ''
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

  const openModal = (type: 'edit' | 'delete' | 'add', produit?: Produit) => {
    setModalType(type);
    setModalProduit(produit || null);
    setModalOpen(true);

    if (type === 'edit' && produit) {
      setFormNom(produit.nom);
      setFormPrixAchat(produit.prix_achat);
      setFormPrixVente(produit.prix_vente);
      setFormStockActuel(produit.stock_actuel);
      setFormStockMinimum(produit.stock_minimum);
      setFormCategorieId(produit.Categorie?.id ?? null);
    } else if (type === 'add') {
      setFormNom('');
      setFormPrixAchat('');
      setFormPrixVente('');
      setFormStockActuel('');
      setFormStockMinimum('');
      setFormCategorieId(null);
      setFormUtilisateurId(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalProduit(null);
  };

  // DELETE produit
  const handleDelete = async () => {
    if (!modalProduit) return;
    try {
      const res = await fetch(`http://localhost:3000/api/produit/supprimer/${modalProduit.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setData((prev) => prev.filter((p) => p.id !== modalProduit.id));
      closeModal();
      showNotification('Produit supprimé avec succès.');
      if ((currentPage - 1) * itemsPerPage >= filteredData.length - 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // PUT (modifier produit)
  const handleEdit = async () => {
    if (!modalProduit) return;
    if (!formNom || formPrixAchat === '' || formPrixVente === '') {
      alert('Merci de remplir les champs obligatoires (nom, prix achat, prix vente)');
      return;
    }
    try {
      setLoadingSubmit(true);
      const updatedProduit = {
        nom: formNom,
        prix_achat: Number(formPrixAchat),
        prix_vente: Number(formPrixVente),
        stock_actuel: Number(formStockActuel) || 0,
        stock_minimum: Number(formStockMinimum) || 0,
        categorieId: formCategorieId,
        utilisateurId: formUtilisateurId,
      };
      const res = await fetch(`http://localhost:3000/api/produit/${modalProduit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduit),
      });
      if (!res.ok) throw new Error('Erreur lors de la modification');
      const dataApi = await res.json();
      setData((prev) =>
        prev.map((p) => (p.id === modalProduit.id ? dataApi.produit ?? dataApi : p))
      );
      closeModal();
      showNotification('Produit modifié avec succès.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // POST (ajouter produit)
  const handleAdd = async () => {
    if (!formNom || formPrixAchat === '' || formPrixVente === '') {
      alert('Merci de remplir les champs obligatoires (nom, prix achat, prix vente)');
      return;
    }
    try {
      setLoadingSubmit(true);
      const newProduit = {
        nom: formNom,
        prix_achat: Number(formPrixAchat),
        prix_vente: Number(formPrixVente),
        stock_actuel: Number(formStockActuel) || 0,
        stock_minimum: Number(formStockMinimum) || 0,
        categorieId: formCategorieId,
        utilisateurId: formUtilisateurId,
      };
      const res = await fetch('http://localhost:3000/api/produit/create', {
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
      showNotification('Produit ajouté avec succès.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const formatPrix = (prix: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(prix);
  };

  // Ajoute ceci en haut dans le composant
  const [formPrixAchatAffiche, setFormPrixAchatAffiche] = useState('');

  const handlePrixAchatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valeur = e.target.value.replace(/\s/g, '').replace(',', '.'); // Enlever espaces, convertir virgule en point
    if (/^\d*\.?\d{0,2}$/.test(valeur)) {
      const number = valeur === '' ? '' : parseFloat(valeur);
      setFormPrixAchat(number);
      if (valeur === '') {
        setFormPrixAchatAffiche('');
      } else {
        const parts = valeur.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        setFormPrixAchatAffiche(parts.join('.'));
      }
    }
  };

  const [formPrixVenteAffiche, setFormPrixVenteAffiche] = useState('');

  const handlePrixVenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valeur = e.target.value.replace(/\s/g, '').replace(',', '.');
    if (/^\d*\.?\d{0,2}$/.test(valeur)) {
      const number = valeur === '' ? '' : parseFloat(valeur);
      setFormPrixVente(number);
      if (valeur === '') {
        setFormPrixVenteAffiche('');
      } else {
        const parts = valeur.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        setFormPrixVenteAffiche(parts.join('.'));
      }
    }
  };

  console.log(currentData.length);


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>La Liste Des Produits</h1>

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
                <th>Nom</th>
                <th>Prix Achat</th>
                <th>Prix Vente</th>
                <th>Total Achat</th>
                <th>Total Vente</th>
                <th>Bénéfice</th>
                <th>Stock Actuel</th>
                <th>Stock Minimum</th>
                <th>Catégorie</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((produit) => (
                  <tr key={produit.id}>
                    <td>{produit.id}</td>
                    <td>{produit.nom}</td>
                    <td>{formatPrix(produit.prix_achat)}</td>
                    <td>{formatPrix(produit.prix_vente)}</td>
                    <td>{formatPrix(produit.stock_actuel * produit.prix_achat)}</td>
                    <td>{formatPrix(produit.stock_actuel * produit.prix_vente)}</td>
                    <td>{formatPrix((produit.stock_actuel * produit.prix_vente) - (produit.stock_actuel * produit.prix_achat))}</td>
                    <td>{produit.stock_actuel}</td>
                    <td>{produit.stock_minimum}</td>
                    <td>{produit.Categorie?.nom}</td>
                    <td>
                      <button
                        title="Modifier"
                        className={styles.actionButton}
                        onClick={() => openModal('edit', produit)}
                      >
                        ✏️
                      </button>
                      <button
                        title="Supprimer"
                        className={styles.actionButton}
                        onClick={() => openModal('delete', produit)}
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
            {modalType === 'edit' && modalProduit && (
              <>
                <h2>Modifier produit</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEdit();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nom"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="Prix Achat"
                    value={formPrixAchat}
                    onChange={(e) => setFormPrixAchat(e.target.value === '' ? '' : Number(e.target.value))}
                    className={styles.modalInput}
                    required
                    min={0}
                    step="0.01"
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="Prix Vente"
                    value={formPrixVente}
                    onChange={(e) => setFormPrixVente(Number(e.target.value))}
                    className={styles.modalInput}
                    required
                    min={0}
                    step="0.01"
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="Stock Actuel"
                    value={formStockActuel}
                    onChange={(e) => setFormStockActuel(Number(e.target.value))}
                    className={styles.modalInput}
                    min={0}
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="Stock Minimum"
                    value={formStockMinimum}
                    onChange={(e) => setFormStockMinimum(Number(e.target.value))}
                    className={styles.modalInput}
                    min={0}
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="ID Catégorie"
                    value={formCategorieId ?? ''}
                    onChange={(e) => setFormCategorieId(Number(e.target.value))}
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

            {modalType === 'delete' && modalProduit && (
              <>
                <h2>Confirmer</h2>
                <p>
                  Veux-tu vraiment supprimer <strong>{modalProduit.nom}</strong> ?
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
                <h2>Ajouter un produit</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdd();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nom"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />
                  <input
                    type="text"
                    placeholder="Prix Achat"
                    value={formPrixAchatAffiche}
                    onChange={handlePrixAchatChange}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />

                  {/* <input
                    type="number"
                    placeholder="Prix Achat"
                    value={formPrixAchat}
                    onChange={(e) => setFormPrixAchat(e.target.value === '' ? '' : Number(e.target.value))}
                    className={styles.modalInput}
                    required
                    min={0}
                    step="0.01"
                    disabled={loadingSubmit}
                  /> */}
                  <input
                    type="text"
                    placeholder="Prix Vente"
                    value={formPrixVenteAffiche}
                    onChange={handlePrixVenteChange}
                    className={styles.modalInput}
                    required
                    disabled={loadingSubmit}
                  />

                  {/* <input
                    type="number"
                    placeholder="Prix Vente"
                    value={formPrixVente}
                    onChange={(e) => setFormPrixVente(Number(e.target.value))}
                    className={styles.modalInput}
                    required
                    min={0}
                    step="0.01"
                    disabled={loadingSubmit}
                  /> */}
                  <input
                    type="number"
                    placeholder="Stock Actuel"
                    value={formStockActuel}
                    onChange={(e) => setFormStockActuel(Number(e.target.value))}
                    className={styles.modalInput}
                    min={0}
                    disabled={loadingSubmit}
                  />
                  <input
                    type="number"
                    placeholder="Stock Minimum"
                    value={formStockMinimum}
                    onChange={(e) => setFormStockMinimum(Number(e.target.value))}
                    className={styles.modalInput}
                    min={0}
                    disabled={loadingSubmit}
                  />

                  <select
                    value={formCategorieId ?? ''}
                    onChange={(e) => setFormCategorieId(Number(e.target.value))}
                    className={styles.modalInput}
                  >
                    <option value="">-- Catégorie --</option>
                    {dataCategorie.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nom}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="ID Utilisateur"
                    value={formUtilisateurId ?? ''}
                    onChange={(e) => setFormUtilisateurId(Number(e.target.value))}
                    className={styles.modalInput}
                    min={1}
                  />
                  {/* <input
                    type="number"
                    placeholder="ID Catégorie"
                    value={formCategorieId ?? ''}
                    onChange={(e) => setFormCategorieId(Number(e.target.value))}
                    className={styles.modalInput}
                    min={1}
                    disabled={loadingSubmit}
                  /> */}
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
