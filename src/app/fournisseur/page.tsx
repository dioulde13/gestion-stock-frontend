'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import styles from './fournisseur.module.css';
import ProtectedRoute from '../components/ProtectedRoute';
import { getUserFromCookie } from '../utils/jwt';


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type Utilisateur = {
  id: number;
  nom: string;
};

type Fournisseur = {
  id: number;
  nom: string;
  adresse: string;
  email: string;
  telephone: number;
  Utilisateur?: Utilisateur;
};

export default function ProduitTable() {
  const [dataUtilisateur, setDataUtilisateur] = useState<Utilisateur[]>([]);
  const [data, setData] = useState<Fournisseur[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [modalFournisseur, setModalFournisseur] = useState<Fournisseur | null>(null);

  // Form state
  const [formNom, setFormNom] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelephone, setFormTelephone] = useState<number | ''>('');
  const [formUtilisateurId, setFormUtilisateurId] = useState<number | null>(null);



  // Loading submit pour ajout/modif
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    const user = getUserFromCookie();
    if (user) {
      setFormUtilisateurId(user.id);
      console.log('Utilisateur connecté:', user); // Pour debug
    }
    fetchFournisseur();
    fetchUtilisateur();
  }, []);


  const fetchFournisseur = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/fournisseur/liste');
      if (!res.ok) {
        const errorData = await res.json(); // On récupère l'objet JSON
        throw new Error(errorData.message.message);
      }
      const fournisseur: Fournisseur[] = await res.json();
      setData(fournisseur);
      console.log(fournisseur);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };


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

  // Notification helper
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredData = data.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.nom && p.nom.toLowerCase().includes(searchLower)
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
      ['ID', 'Nom', 'Adresse', 'Telephone', 'Utilisateur'],
      ...filteredData.map((p) => [
        p.id,
        p.nom,
        p.adresse,
        p.email,
        p.telephone,
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
    doc.text('Liste des produits', 14, 10);
    doc.autoTable({
      head: [['ID', 'Nom', 'Adresse', 'Email', 'Telephone', 'Utilisateur']],
      body: filteredData.map((p) => [
        p.id,
        p.nom,
        p.adresse,
        p.email,
        p.telephone,
        p.Utilisateur?.nom ?? ''
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

  const openModal = (type: 'edit' | 'delete' | 'add', fournisseur?: Fournisseur) => {
    setModalType(type);
    setModalFournisseur(fournisseur || null);
    setModalOpen(true);

    if (type === 'edit' && fournisseur) {
      setFormNom(fournisseur.nom);
      setFormAdresse(fournisseur.adresse);
      setFormTelephone(fournisseur.telephone);
      setFormEmail(fournisseur.email);
      setFormUtilisateurId(fournisseur.Utilisateur?.id ?? null);
    } else if (type === 'add') {
      setFormNom('');
      setFormAdresse('');
      setFormTelephone('');
      setFormEmail('');
      setFormUtilisateurId(formUtilisateurId);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalFournisseur(null);
  };

  // DELETE produit
  const handleDelete = async () => {
    if (!modalFournisseur) return;
    try {
      const res = await fetch(`http://localhost:3000/api/fournisseur/supprimer/${modalFournisseur.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setData((prev) => prev.filter((p) => p.id !== modalFournisseur.id));
      closeModal();
      fetchFournisseur();
      showNotification('Fournisseur supprimé avec succès.');
      if ((currentPage - 1) * itemsPerPage >= filteredData.length - 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // PUT (modifier produit)
  const handleEdit = async () => {
    if (!modalFournisseur) return;
    if (!formNom || formNom === '' || formAdresse === '') {
      alert('Merci de remplir les champs obligatoires (nom, adresse)');
      return;
    }
    try {
      setLoadingSubmit(true);
      const updatedProduit = {
        nom: formNom,
        adresse: formAdresse,
        email: formEmail,
        telephone: Number(formTelephone),
        utilisateurId: formUtilisateurId,
      };
      const res = await fetch(`http://localhost:3000/api/fournisseur/modifier/${modalFournisseur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduit),
      });
      if (!res.ok) throw new Error('Erreur lors de la modification');
      const dataApi = await res.json();
      setData((prev) =>
        prev.map((p) => (p.id === modalFournisseur.id ? dataApi.produit ?? dataApi : p))
      );
      closeModal();
      fetchFournisseur();
      showNotification('Fournisseur modifié avec succès.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // POST (ajouter produit)
  const handleAdd = async () => {
    if (!formNom || formAdresse === '' || formTelephone === '') {
      alert('Merci de remplir les champs obligatoires (nom)');
      return;
    }
    try {
      setLoadingSubmit(true);
      const newFournisseur = {
        nom: formNom,
        adresse: formAdresse,
        email: formEmail,
        telephone: Number(formTelephone),
        utilisateurId: formUtilisateurId,
      };
      console.log(newFournisseur);
      const res = await fetch('http://localhost:3000/api/fournisseur/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFournisseur),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const dataApi = await res.json();

      setData((prev) => [...prev, dataApi.produit ?? dataApi]);
      setSearch('');
      const newTotalItems = filteredData.length + 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      setCurrentPage(newTotalPages);
      closeModal();
      fetchFournisseur();
      showNotification('Fournisseur ajouté avec succès.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };


  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <h1 className={styles.title}>La Liste Des Fournisseurs</h1>

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
                  <th>Adresse</th>
                  <th>Email</th>
                  <th>Telephone</th>
                  <th>Utilisateur</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((fournisseur) => (
                    <tr key={fournisseur.id}>
                      <td>{fournisseur.id}</td>
                      <td>{fournisseur.nom}</td>
                      <td>{fournisseur.adresse}</td>
                      <td>{fournisseur.email}</td>
                      <td>{fournisseur.telephone}</td>
                      <td>{fournisseur.Utilisateur?.nom}</td>
                      <td>
                        <button
                          title="Modifier"
                          className={styles.actionButton}
                          onClick={() => openModal('edit', fournisseur)}
                        >
                          ✏️
                        </button>
                        <button
                          title="Supprimer"
                          className={styles.actionButton}
                          onClick={() => openModal('delete', fournisseur)}
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
              {modalType === 'edit' && modalFournisseur && (
                <>
                  <h2>Modifier fournisseur</h2>
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
                      type="text"
                      placeholder="Adresse"
                      value={formAdresse}
                      onChange={(e) => setFormAdresse(e.target.value)}
                      className={styles.modalInput}
                      required
                      disabled={loadingSubmit}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className={styles.modalInput}
                      required
                      disabled={loadingSubmit}
                    />
                    <input
                      type="number"
                      placeholder="Telephone"
                      value={formTelephone}
                      onChange={(e) => setFormTelephone(e.target.value === '' ? '' : Number(e.target.value))}
                      className={styles.modalInput}
                      required
                      min={0}
                      step="0.01"
                      disabled={loadingSubmit}
                    />
                    <input
                      type="number"
                      placeholder="ID Utilisateur"
                      value={formUtilisateurId ?? ''}
                      onChange={(e) => setFormTelephone(Number(e.target.value))}
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

              {modalType === 'delete' && modalFournisseur && (
                <>
                  <h2>Confirmer</h2>
                  <p>
                    Veux-tu vraiment supprimer <strong>{modalFournisseur.nom}</strong> ?
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
                  <h2>Ajouter un fournisseur</h2>
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
                      placeholder="Adresse"
                      value={formAdresse}
                      onChange={(e) => setFormAdresse(e.target.value)}
                      className={styles.modalInput}
                      required
                      disabled={loadingSubmit}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className={styles.modalInput}
                      required
                      disabled={loadingSubmit}
                    />
                    <input
                      type="number"
                      placeholder="Telephone"
                      value={formTelephone}
                      onChange={(e) => setFormTelephone(Number(e.target.value))}
                      className={styles.modalInput}
                      required
                      disabled={loadingSubmit}
                    />

                    {/* <select
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
                    </select> */}
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
    </ProtectedRoute>
  );
}
