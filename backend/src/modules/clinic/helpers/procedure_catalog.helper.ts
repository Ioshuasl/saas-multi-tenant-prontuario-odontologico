export type ProcedureCatalogEntry = {
  code: string;
  name: string;
  specialty: string;
  defaultMinutes: number;
  requiresTooth: boolean;
  requiresFace?: boolean;
};

export const DEFAULT_PROCEDURE_CATALOG: readonly ProcedureCatalogEntry[] = [
  { code: 'CONS-01', name: 'Consulta de avaliação/diagnóstico', specialty: 'Clínica geral', defaultMinutes: 30, requiresTooth: false },
  { code: 'PROF-01', name: 'Profilaxia + polimento', specialty: 'Prevenção', defaultMinutes: 40, requiresTooth: false },
  { code: 'RAD-01', name: 'Radiografia periapical', specialty: 'Radiologia', defaultMinutes: 15, requiresTooth: true },
  { code: 'RES-01', name: 'Restauração em resina — 1 face', specialty: 'Dentística', defaultMinutes: 40, requiresTooth: true },
  { code: 'RES-02', name: 'Restauração em resina — 2 ou mais faces', specialty: 'Dentística', defaultMinutes: 60, requiresTooth: true },
  { code: 'EXO-01', name: 'Exodontia simples', specialty: 'Cirurgia', defaultMinutes: 40, requiresTooth: true },
  { code: 'EXO-02', name: 'Exodontia de terceiro molar', specialty: 'Cirurgia', defaultMinutes: 60, requiresTooth: true },
  { code: 'END-01', name: 'Tratamento endodôntico — unirradicular', specialty: 'Endodontia', defaultMinutes: 90, requiresTooth: true },
  { code: 'END-02', name: 'Tratamento endodôntico — multirradicular', specialty: 'Endodontia', defaultMinutes: 120, requiresTooth: true },
  { code: 'PERI-01', name: 'Raspagem supragengival', specialty: 'Periodontia', defaultMinutes: 45, requiresTooth: false },
  { code: 'PROT-01', name: 'Coroa provisória', specialty: 'Prótese', defaultMinutes: 60, requiresTooth: true },
  { code: 'PROT-02', name: 'Coroa definitiva', specialty: 'Prótese', defaultMinutes: 60, requiresTooth: true },
  { code: 'IMP-01', name: 'Instalação de implante', specialty: 'Implantodontia', defaultMinutes: 90, requiresTooth: true },
  { code: 'CLAR-01', name: 'Clareamento em consultório', specialty: 'Estética', defaultMinutes: 60, requiresTooth: false },
  { code: 'ORTO-01', name: 'Manutenção ortodôntica', specialty: 'Ortodontia', defaultMinutes: 30, requiresTooth: false },
  { code: 'URG-01', name: 'Urgência/atendimento de dor', specialty: 'Clínica geral', defaultMinutes: 30, requiresTooth: false },
] as const;
