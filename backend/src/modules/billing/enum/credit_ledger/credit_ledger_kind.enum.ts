export const CREDIT_LEDGER_KINDS = ['CREDIT', 'DEBIT', 'REVERSE'] as const;

export type CreditLedgerKind = (typeof CREDIT_LEDGER_KINDS)[number];
