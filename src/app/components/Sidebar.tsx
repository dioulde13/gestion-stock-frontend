"use client";

import Link from "next/link";
import {
  Bell,
  DollarSign,
  House,
  Info,
  Mail,
  Menu,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users,
} from "lucide-react";
import React, { useState } from "react";

const ICONS = {
  House,
  DollarSign,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Mail,
  Users,
  Bell,
  Info,
};

type IconName = keyof typeof ICONS;

type SidebarItem = {
  name: string;
  icon: IconName;
  href: string;
};

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarItems] = useState<SidebarItem[]>([
    { name: "Accueil", icon: "House", href: "/" },
    { name: "Ventes", icon: "DollarSign", href: "/ventes" },
    { name: "Categories", icon: "ShoppingBag", href: "/categories" },
    { name: "Produits", icon: "ShoppingBag", href: "/produits" },
    { name: "Stock Minimum", icon: "ShoppingBag", href: "/stockMinimum" },
    { name: "Achat", icon: "ShoppingCart", href: "/achats" },
    { name: "Fournisseurs", icon: "ShoppingCart", href: "/fournisseur" },
    { name: "Utilisateurs", icon: "Users", href: "/utilisateurs" },
  ]);

  const handleLinkClick = () => {
    setIsSidebarOpen(false); // Ferme la sidebar au clic sur un lien
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-[#1e1e1e] text-white z-50 transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded hover:bg-[#2f2f2f] transition-colors mb-6"
          aria-label="Toggle sidebar"
        >
          <Menu />
        </button>

        <ul className="space-y-4">
          {sidebarItems.map((item, index) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={index}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 hover:bg-gray-800 p-2 rounded cursor-pointer"
                >
                  <Icon className="w-5 h-5" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
