import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
      aria-label={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
      title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase font-medium">{i18n.language === 'fr' ? 'EN' : 'FR'}</span>
    </button>
  );
};

export default LanguageSelector;
