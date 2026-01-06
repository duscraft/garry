import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">Garry</span>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('footer.legal')}
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('footer.privacy')}
            </a>
          </div>

          <p className="text-sm text-slate-400">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
