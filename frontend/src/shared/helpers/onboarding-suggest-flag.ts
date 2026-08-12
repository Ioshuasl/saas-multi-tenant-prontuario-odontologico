const ONBOARDING_SUGGEST_KEY = 'suggest-onboarding-wizard';

export function markOnboardingSuggest(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ONBOARDING_SUGGEST_KEY, '1');
}

export function clearOnboardingSuggest(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ONBOARDING_SUGGEST_KEY);
}

export function hasOnboardingSuggest(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ONBOARDING_SUGGEST_KEY) === '1';
}
