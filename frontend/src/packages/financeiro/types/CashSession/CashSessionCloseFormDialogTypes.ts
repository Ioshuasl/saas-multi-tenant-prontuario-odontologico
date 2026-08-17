import type { CashSession } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export type CashSessionCloseFormDialogProps = {
  session: CashSession;
  onClose: () => void;
};
