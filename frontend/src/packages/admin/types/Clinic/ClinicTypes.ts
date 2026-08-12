export type ClinicAddress = {
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export type ClinicProfile = {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  taxId: string | null;
  responsibleCro: string | null;
  timezone: string;
  acceptedPaymentMethods: string[];
  defaultUnit: {
    id: string;
    name: string;
    phone: string | null;
    address: ClinicAddress | null;
  } | null;
};
