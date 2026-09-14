import { digitsOnly } from '@/packages/admin/helpers/BrazilDocumentMasks';

export type CepLookupResult = {
  postalCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  timezoneName?: string;
};

export type CnpjLookupResult = {
  taxId: string;
  legalName: string;
  tradeName: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
};

export class BrazilLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrazilLookupError';
  }
}

type BrasilCepResponse = {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  timezoneName?: string;
  message?: string;
};

type BrasilCnpjResponse = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  ddd_telefone_1?: string | null;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  message?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (response.status === 404) {
    throw new BrazilLookupError('Não encontrado. Confira o número e tente de novo.');
  }
  if (!response.ok) {
    throw new BrazilLookupError('Consulta indisponível no momento. Tente novamente.');
  }
  return (await response.json()) as T;
}

export async function lookupCep(cep: string): Promise<CepLookupResult> {
  const digits = digitsOnly(cep);
  if (digits.length !== 8) {
    throw new BrazilLookupError('Informe um CEP com 8 dígitos.');
  }

  const data = await fetchJson<BrasilCepResponse>(
    `https://brasilapi.com.br/api/cep/v2/${digits}`,
  );

  if (!data.cep || data.message) {
    throw new BrazilLookupError('CEP não encontrado.');
  }

  return {
    postalCode: digits,
    street: data.street ?? '',
    district: data.neighborhood ?? '',
    city: data.city ?? '',
    state: (data.state ?? '').toUpperCase(),
    timezoneName: data.timezoneName,
  };
}

export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  const digits = digitsOnly(cnpj);
  if (digits.length !== 14) {
    throw new BrazilLookupError('Informe um CNPJ com 14 dígitos.');
  }

  const data = await fetchJson<BrasilCnpjResponse>(
    `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
  );

  if (!data.cnpj || data.message) {
    throw new BrazilLookupError('CNPJ não encontrado.');
  }

  const phoneDigits = digitsOnly(data.ddd_telefone_1 ?? '');

  return {
    taxId: digits,
    legalName: data.razao_social?.trim() ?? '',
    tradeName: data.nome_fantasia?.trim() ?? '',
    phone: phoneDigits,
    street: data.logradouro?.trim() ?? '',
    number: data.numero?.trim() ?? '',
    complement: data.complemento?.trim() ?? '',
    district: data.bairro?.trim() ?? '',
    city: data.municipio?.trim() ?? '',
    state: (data.uf ?? '').toUpperCase(),
    postalCode: digitsOnly(data.cep ?? ''),
  };
}
