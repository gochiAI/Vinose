import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ 
  icon, 
  label, 
  active = false, 
  badge = false,
  onClick 
}: { 
  icon: string; 
  label: string; 
  active?: boolean; 
  badge?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg transition-colors group relative ${
      active
        ? 'text-primary bg-primary/10 border border-primary/20'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    {badge && (
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-surface-darker"></div>
    )}
    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50 text-white">
      {label}
    </div>
  </button>
);

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <nav className="w-16 border-r border-border-dark flex flex-col items-center py-6 gap-6 bg-surface-darker z-20 shrink-0">
      <div 
        className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4 cursor-pointer hover:bg-primary-hover transition-colors"
        onClick={() => navigate('/dashboard')}
      >
        <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
        </svg>
      </div>
      <NavItem 
        icon="dashboard" 
        label="Dashboard" 
        active={currentPath === '/dashboard'} 
        onClick={() => navigate('/dashboard')}
      />
      <NavItem 
        icon="folder_managed" 
        label="Documents" 
        active={currentPath === '/documents'} 
        onClick={() => navigate('/documents')}
      />
      <NavItem 
        icon="account_tree" 
        label="Flow & Script" 
        active={currentPath === '/chapters' || currentPath.startsWith('/chapter') || currentPath.startsWith('/editor')} 
        onClick={() => navigate('/chapters')}
      />
      <NavItem 
        icon="group" 
        label="Characters" 
        active={currentPath === '/characters'}
        onClick={() => navigate('/characters')} 
      />
      <NavItem 
        icon="folder_open" 
        label="Assets" 
        active={currentPath === '/assets'}
        onClick={() => navigate('/assets')}
      />
      <div className="flex-1"></div>
      <button 
        className={`p-3 rounded-lg transition-colors ${currentPath === '/settings' ? 'text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        onClick={() => navigate('/settings')}
      >
        <span className="material-symbols-outlined">settings</span>
      </button>
      <div 
        className="size-8 rounded-full bg-gray-700 bg-cover bg-center mb-2 cursor-pointer border border-transparent hover:border-gray-500 transition-colors" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDVso8VvKUh2WlsJsHgYwbUKjS2xy9b0wvL7V5wR5qqYicOhyvf0Cz_VN_CHGGipa3s5i0LzIUF-cz_27XAEy3Eb5PGMZPQCayFLMW5WajSjy2uCPM0EJcaEdCZCRgj3QEXijfpIgIt_WcUY9mibq9bzEVJkFHjBrKIdFob40sqrH_NXUHm-2-EWCNgDgHPnf0hz1JFvkw9g5i5L5q-7iueZNP071bSgGhBIqDju0k_O5eNYy4T4iAYbLJRMfY56OdAMk6E_d8lor3N')" }}
      ></div>
    </nav>
  );
};