import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/i18n/translations';

export const useTranslation = () => {
  const { language: storeLanguage, hasHydrated } = useSettingsStore();

  // Hydration safety: use 'EN' during server-side render or until client-side hydration is complete
  const language = hasHydrated ? storeLanguage : 'EN';
  
  const t = (key: keyof typeof translations.EN, variables?: Record<string, string>): string => {
    if (!hasHydrated) return (translations.EN as any)[key] || key;
    let translation = (translations[language as 'EN' | 'HI'] as any)[key] || (translations.EN as any)[key] || key;
    
    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        translation = translation.replace(new RegExp(`{${name}}`, 'g'), value);
      });
    }
    
    return translation;
  };

  return { t, language, hasHydrated };
};
