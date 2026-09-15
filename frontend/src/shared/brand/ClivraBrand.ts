/** Marca Clivra — só constantes de UI (sem fluxo/domínio). */
export const CLIVRA = {
  name: 'Clivra',
  tagline: 'Clínicas odontológicas mais eficientes',
  description: 'Prontuário, agenda e gestão para clínicas odontológicas',
  /** Mark isolado (PNG transparente). */
  logoIcon: '/brand/logo-icon.png',
  /** Mark + “Clivra” — texto escuro (fundos claros). */
  logoWordmark: '/brand/logo-wordmark.png',
  /** Mark + “Clivra” — texto branco (fundos escuros). */
  logoWordmarkLight: '/brand/logo-wordmark-light.png',
  /** Mark + “Clivra” — texto burgundy. */
  logoWordmarkBurgundy: '/brand/logo-wordmark-burgundy.png',
  favicon: '/favicon.ico',
  appleIcon: '/apple-icon.png',
  loginClinicBg: '/brand/img-bg-login-page.png',
  /** Paleta oficial (espelho de globals.css / DS) — preferir tokens CSS na UI. */
  colors: {
    burgundy: '#4A0F16',
    secondary: '#7A2B36',
    accent: '#A85B67',
    background: '#F7F5F2',
    surface: '#FFFFFF',
    neutral: '#EAE6E1',
    border: '#DDD8D3',
    text: '#1A1A1A',
    textSecondary: '#6B6663',
    success: '#2F8F63',
    warning: '#C98A32',
    danger: '#B94A55',
    info: '#587A9B',
  },
} as const;
