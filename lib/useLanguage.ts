export { useLanguage } from './AppContext';
export type { Language } from './translations';
export async function setLanguage(lang: any) {}
export async function loadLanguage() {}
export async function setLanguageWithConfirm(lang: any, name: string) {}
export function getCurrentLanguage() { return 'en'; }