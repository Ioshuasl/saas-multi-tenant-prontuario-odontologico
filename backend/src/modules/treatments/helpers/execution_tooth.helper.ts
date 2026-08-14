const DEFAULT_BY_PREFIX: Record<string, string> = {
  RES: 'RESTORED',
  EXO: 'EXTRACTED',
  IMP: 'IMPLANT',
  PROT: 'CROWN',
  END: 'ROOT_CANAL',
};

export function defaultToothCondition(procedureCode: string): string | null {
  const prefix = procedureCode.split('-')[0] ?? '';
  return DEFAULT_BY_PREFIX[prefix] ?? null;
}
