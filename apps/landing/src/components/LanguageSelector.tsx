import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle language"
    >
      <div className="flex items-center gap-2">
        <Languages className="w-5 h-5" />
        <span className="text-sm font-medium uppercase">{i18n.language.split('-')[0]}</span>
      </div>
    </button>
  );
}
