// 'use client';

// import { useEffect, useState } from 'react';
// import Sidebar from './Sidebar';

// export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
//   const [hasToken, setHasToken] = useState(false);

//   useEffect(() => {
//     const tokenExists = document.cookie.includes('token');
//     console.log(tokenExists);
//     setHasToken(tokenExists);
//   }, []);

//   return (
//     <>
//       {hasToken && <Sidebar />}
//       <div className="pl-20 transition-all duration-300">
//         <main className="p-4">{children}</main>
//       </div>
//     </>
//   );
// }


'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { FaUserCircle } from 'react-icons/fa';
import './modal.css';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState(false);
  const [showModal, setShowModal] = useState(false);
  console.log(hasToken);

  useEffect(() => {
      const tokenExists = document.cookie.includes('token');
      setHasToken(tokenExists);
      console.log(tokenExists);
  }, []);

  const handleLogout = () => {
    // Supprimer le token du cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    window.location.href = '/login';
  };

  return (
    <>
      {hasToken && <Sidebar />}
      <div className="pl-20 transition-all duration-300">
        {hasToken && (
          <div className="header">
            <FaUserCircle className="icon" size={30} onClick={() => setShowModal(!showModal)} />
            {showModal && (
              <div className="modal">
                <ul>
                  <li onClick={() => alert('Fonction Profil à venir')}>👤 Profil</li>
                  <li onClick={handleLogout}>🚪 Déconnexion</li>
                </ul>
              </div>
            )}
          </div>
        )}
        <main className="p-4">{children}</main>
      </div>
    </>
  );
}
