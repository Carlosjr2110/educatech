"use client";

import { LogOut, Cpu, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BurguerMenu from "../menu/burguerMenu";

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(status === "authenticated");
  }, [status]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-blue-950 dark:bg-slate-900 h-20 text-white py-6 shadow-md flex px-6 items-center justify-between border-b border-blue-900 dark:border-slate-700 transition-colors duration-300 relative">
        
        {/* Menu Hamburger - só aparece quando autenticado */}
        <div className="flex items-center">
          {isAuthenticated && (
            <button
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-slate-600 transition-all"
              aria-label="Menu"
              title="Menu"
            >
              {isMenuOpen ? (
                <X size={24} className="text-slate-100 dark:text-slate-200" />
              ) : (
                <Menu size={24} className="text-slate-100 dark:text-slate-200" />
              )}
            </button>
          )}
        </div>

        {/* Título - centralizado */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-lg md:text-2xl lg:text-3xl font-semibold uppercase tracking-wider text-slate-100 dark:text-slate-200 flex items-center">
          Educa 
          <Cpu height="1em" className="mx-1" />
          Tech
        </div>

       
      </header>

      {/* Menu lateral - só aparece quando autenticado */}
      {isAuthenticated && (
        <BurguerMenu
          isOpen={isMenuOpen}
          onClose={closeMenu}
          user={session?.user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default Header;