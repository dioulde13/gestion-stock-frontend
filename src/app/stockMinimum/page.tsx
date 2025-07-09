'use client';

import { useState, useEffect } from 'react';
import 'jspdf-autotable';
import styles from './stockMinimum.module.css';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


type Produit = {
  id: number;
  nom: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  stock_minimum: number;
};

export default function ProduitTableStockMinimum() {
  const [data, setData] = useState<Produit[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/produit/alert');
      if (!res.ok) throw new Error('Erreur lors du chargement des produits');
      const produits: Produit[] = await res.json();
      setData(produits);
      console.log(produits);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
      ['Nom', 'Prix Achat', 'Prix Vente', 'Stock Actuel', 'Stock Minimum'],
      ...filteredData.map((p) => [
        p.nom,
        p.prix_achat,
        p.prix_vente,
        p.stock_actuel,
        p.stock_minimum,
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


  const goToPage = (page: number) => {
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>La Liste Des Produits En Alerte De Stock</h1>
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
                <th>Prix Achat</th>
                <th>Prix Vente</th>
                <th>Stock Actuel</th>
                <th>Stock Minimum</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length ? (
                currentData.map((produit) => (
                  <tr key={produit.id}>
                    <td>{produit.nom}</td>
                    <td>{produit.prix_achat}</td>
                    <td>{produit.prix_vente}</td>
                    <td>{produit.stock_actuel}</td>
                    <td>{produit.stock_minimum}</td>
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
    </div>
  );
}
