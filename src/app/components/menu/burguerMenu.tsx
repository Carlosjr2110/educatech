"use client";

import { LogOut, X, Home, Users, BookOpen, Book, BarChart3, Settings, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface User {
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface BurguerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onLogout: () => void;
}

const BurguerMenu: React.FC<BurguerMenuProps> = ({
  isOpen,
  onClose,
  user,
  onLogout
}) => {
  const pathname = usePathname();

  // Permissões por role
  const userRole = user?.role || 'aluno';
  
  const hasAccess = {
    turmas: ['professor'].includes(userRole),
    planoAulas: ['professor', 'aluno'].includes(userRole),
    avaliacoes: ['professor', 'aluno'].includes(userRole),
    desempenho: ['professor', 'aluno', 'responsavel'].includes(userRole),
    estudantes: ['responsavel'].includes(userRole),
  };

  // Estrutura do menu simplificada - apenas links diretos
  const menuItems = [
    {
      key: 'painel',
      href: '/painel',
      icon: Home,
      label: 'Painel',
      visible: true
    },
    {
      key: 'turmas',
      href: '/turmas',
      icon: Users,
      label: 'Turmas',
      visible: hasAccess.turmas
    },
    {
      key: 'plano-aulas',
      href: '/planodeaulas',
      icon: BookOpen,
      label: 'Plano de Aulas',
      visible: hasAccess.planoAulas
    },
    {
      key: 'avaliacoes',
      href: '/avaliacoes',
      icon: Book,
      label: 'Avaliações e Testes',
      visible: hasAccess.avaliacoes
    },
    {
      key: 'desempenho',
      href: '/desempenho',
      icon: BarChart3,
      label: 'Desempenho',
      visible: hasAccess.desempenho
    },
    {
      key: 'estudantes',
      href: '/estudantes',
      icon: GraduationCap,
      label: 'Estudantes',
      visible: hasAccess.estudantes
    }
  ];

  const handleItemClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed top-0 left-0 h-full w-[85vw] sm:w-80 max-w-sm bg-blue-950 dark:bg-slate-900 text-white z-50 transform transition-transform duration-300 overflow-y-auto scrollbar-thin">
        
        {/* Cabeçalho do menu */}
        <div className="p-6 border-b border-blue-900 dark:border-slate-700 sticky top-0 bg-blue-950 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                
              </div>
              <div>
                <p className="font-medium">{user?.name || "Usuário"}</p>
                <p className="text-sm text-blue-300 capitalize">{user?.role}</p>
                <p className="text-xs text-blue-400 truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-blue-800 transition-colors"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navegação */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (!item.visible) return null;
              
              const IconComponent = item.icon;
              
              const isActive = pathname === item.href;

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`flex items-center py-3 px-4 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-700 dark:bg-slate-700 text-white font-medium'
                        : 'hover:bg-blue-900 dark:hover:bg-slate-800'
                    }`}
                    onClick={handleItemClick}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {IconComponent && <IconComponent size={20} className="mr-3" />}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Botão de logout */}
          <button
            onClick={onLogout}
            className="w-full mt-8 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default BurguerMenu;