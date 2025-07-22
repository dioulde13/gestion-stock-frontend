'use client';

import { useState, useEffect } from 'react';
import 'jspdf-autotable';
import styles from './categorie.module.css';
import ProtectedRoute from '../components/ProtectedRoute';


declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}


type Categorie = {
    id: number;
    nom: string;
};

export default function CategorieTable() {
    const [data, setData] = useState<Categorie[]>([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Notification
    const [notification, setNotification] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
    const [modalCategorie, setModalCategorie] = useState<Categorie | null>(null);

    // Form state
    const [formNom, setFormNom] = useState('');
    const [formUtilisateurId, setFormUtilisateurId] = useState<number | null>(null);

    const itemsPerPage = 5;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:3000/api/categorie/liste');
            if (!res.ok) throw new Error('Erreur lors du chargement des categories');
            const categorie: Categorie[] = await res.json();
            setData(categorie);
            console.log(categorie);
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
            p.nom.toLowerCase().includes(searchLower)
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
            ['ID', 'Nom'],
            ...filteredData.map((p) => [
                p.id,
                p.nom
            ]),
        ];
        const csvContent = csvRows.map((e) => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'categorie.csv';
        link.click();
    };


    const goToPage = (page: number) => {
        if (page < 1) page = 1;
        else if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    const openModal = (type: 'edit' | 'delete' | 'add', categorie?: Categorie) => {
        setModalType(type);
        setModalCategorie(categorie || null);
        setModalOpen(true);

        if (type === 'edit' && categorie) {
            setFormNom(categorie.nom);
        } else if (type === 'add') {
            setFormNom('');
            setFormUtilisateurId(null);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
        setModalCategorie(null);
    };

    // DELETE produit
    const handleDelete = async () => {
        if (!modalCategorie) return;
        try {
            const res = await fetch(`http://localhost:3000/api/categorie/${modalCategorie.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erreur lors de la suppression');
            setData((prev) => prev.filter((p) => p.id !== modalCategorie.id));
            closeModal();
            showNotification('Categorie ajouté avec succès.');
            if ((currentPage - 1) * itemsPerPage >= filteredData.length - 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (e) {
            alert((e as Error).message);
        }
    };

    // PUT (modifier produit)
    const handleEdit = async () => {
        if (!modalCategorie) return;
        try {
            const updatedCategorie = {
                nom: formNom,
                utilisateurId: formUtilisateurId,
            };
            const res = await fetch(`http://localhost:3000/api/categorie/${modalCategorie.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCategorie),
            });
            if (!res.ok) throw new Error('Erreur lors de la modification');
            const dataApi = await res.json();
            setData((prev) =>
                prev.map((p) => (p.id === modalCategorie.id ? dataApi.categorie ?? dataApi : p))
            );
            closeModal();
            showNotification('Categorie ajouté avec succès.');
        } catch (e) {
            alert((e as Error).message);
        }
    };

    // POST (ajouter produit) - CORRECTION ICI
    const handleAdd = async () => {
        try {
            const newProduit = {
                nom: formNom,
                utilisateurId: formUtilisateurId,
            };
            const res = await fetch('http://localhost:3000/api/categorie/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduit),
            });
            if (!res.ok) throw new Error("Erreur lors de l'ajout");
            const dataApi = await res.json();

            // Ajout dans le state data
            setData((prev) => [...prev, dataApi.categorie ?? dataApi]);

            // RESET la recherche pour voir tous les produits
            setSearch('');

            // Calculer la nouvelle page totale et se positionner dessus
            const newTotalItems = filteredData.length + 1; // +1 car on ajoute un produit
            const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
            setCurrentPage(newTotalPages);

            closeModal();
            showNotification('Categorie ajouté avec succès.');
        } catch (e) {
            alert((e as Error).message);
        }
    };

    return (
        <ProtectedRoute>
            <div className={styles.container}>
                <h1 className={styles.title}>La Liste Des Categories</h1>

                {/* Notification */}
                {notification && (
                    <div className={styles.notification}>
                        {notification}
                    </div>
                )}

                <div className={styles.actions}>
                    <button onClick={exportCSV} className={styles.button}>
                        Exporter CSV
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
                                    <th>Nom</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.length ? (
                                    currentData.map((produit) => (
                                        <tr key={produit.id}>
                                            <td>{produit.nom}</td>
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
                            {modalType === 'edit' && modalCategorie && (
                                <>
                                    <h2>Modifier une categorie</h2>
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
                                        />
                                        <div className={styles.modalActions}>
                                            <button type="submit" className={styles.modalButton}>
                                                Confirmer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className={styles.modalCloseButton}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {modalType === 'delete' && modalCategorie && (
                                <>
                                    <h2>Confirmer</h2>
                                    <p>
                                        Veux-tu vraiment supprimer <strong>{modalCategorie.nom}</strong> ?
                                    </p>
                                    <div className={styles.modalActions}>
                                        <button onClick={handleDelete} className={styles.modalButtonDelete}>
                                            Supprimer
                                        </button>
                                        <button
                                            onClick={closeModal}
                                            className={styles.modalCloseButton}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </>
                            )}

                            {modalType === 'add' && (
                                <>
                                    <h2>Ajouter une categorie</h2>
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
                                        />
                                        <input
                                            type="number"
                                            placeholder="ID Utilisateur"
                                            value={formUtilisateurId ?? ''}
                                            onChange={(e) => setFormUtilisateurId(Number(e.target.value))}
                                            className={styles.modalInput}
                                            min={1}
                                        />
                                        <div className={styles.modalActions}>
                                            <button type="submit" className={styles.modalButton}>
                                                Ajouter
                                            </button>
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className={styles.modalCloseButton}
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
