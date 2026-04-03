import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr.json';
import wo from '../locales/wo.json';
import en from '../locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    wo: { translation: wo },
    en: { translation: en },
  },
  lng: localStorage.getItem('langue') || 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;