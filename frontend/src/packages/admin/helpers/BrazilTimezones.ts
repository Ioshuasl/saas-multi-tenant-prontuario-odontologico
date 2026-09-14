/**
 * Fusos IANA usados no Brasil.
 * Backend aceita qualquer string IANA (tenant.timezone); a agenda e orçamentos usam esse valor.
 */
export const BRAZIL_TIMEZONES = [
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC−2)' },
  { value: 'America/Belem', label: 'Belém (UTC−3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (UTC−3)' },
  { value: 'America/Recife', label: 'Recife (UTC−3)' },
  { value: 'America/Araguaina', label: 'Araguaína (UTC−3)' },
  { value: 'America/Maceio', label: 'Maceió (UTC−3)' },
  { value: 'America/Bahia', label: 'Bahia (UTC−3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo / Brasília (UTC−3)' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (UTC−4)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (UTC−4)' },
  { value: 'America/Santarem', label: 'Santarém (UTC−3)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (UTC−4)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (UTC−4)' },
  { value: 'America/Manaus', label: 'Manaus (UTC−4)' },
  { value: 'America/Eirunepe', label: 'Eirunepé (UTC−5)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC−5)' },
] as const;

export type BrazilTimezone = (typeof BRAZIL_TIMEZONES)[number]['value'];

export const BRAZIL_TIMEZONE_VALUES = BRAZIL_TIMEZONES.map((item) => item.value);

const LABEL_BY_VALUE = Object.fromEntries(
  BRAZIL_TIMEZONES.map((item) => [item.value, item.label]),
) as Record<string, string>;

export function brazilTimezoneLabel(value: string): string {
  return LABEL_BY_VALUE[value] ?? value;
}
