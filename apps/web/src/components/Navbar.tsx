import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Plus, Shield, Grid, Menu, X, Sun, Moon } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Garry</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'border-blue-500 text-gray-900 dark:text-white' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-slate-600'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                <Grid className="w-4 h-4 mr-2" />
                {t('nav.dashboard')}
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <LanguageSelector />
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 focus:outline-none ml-2 mr-4 transition-colors duration-200"
              aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
              title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              to="/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('nav.addWarranty')}
            </Link>
            
            <div className="ml-3 relative flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-200 mr-4">
                {user?.name}
              </span>
              <button
                onClick={() => logout()}
                className="bg-white dark:bg-slate-800 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <LanguageSelector />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 focus:outline-none mr-2 transition-colors duration-200"
              aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
              title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-slate-800 transition-colors duration-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`${
                isActive('/')
                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.dashboard')}
            </Link>
            <Link
              to="/add"
              className={`${
                isActive('/add')
                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.addWarranty')}
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center px-4">
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-white">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors duration-200"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
