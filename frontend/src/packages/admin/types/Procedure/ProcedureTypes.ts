export type ProcedureSummary = {
  id: string;
  code: string;
  name: string;
  specialty: string | null;
  defaultMinutes: number;
  priceCents: number;
  requiresTooth: boolean;
  requiresFace: boolean;
  active: boolean;
};

export type ProcedureImportCatalogResult = {
  imported: number;
  skipped: number;
};
