import { Shield, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Hero from './components/Hero';
import Features from './components/Features';
import AppDownload from './components/AppDownload';
import Footer from './components/Footer';
import LanguageSelector from './components/LanguageSelector';
import { useTheme } from './context/ThemeContext';

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">Garry</span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <a 
              href="https://garry-app.antoinelaborderie.com"
              className="hidden sm:block px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              {t('nav.signIn')}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <AppDownload />
      </main>
      <Footer />
    </div>
  );
}

export default App;
