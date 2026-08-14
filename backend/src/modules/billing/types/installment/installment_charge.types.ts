import type { ReceiptSendChannel } from '../../enum/receipt/send_channel.enum.js';

export type ChargeResult = {
  sentVia: ReceiptSendChannel;
  installmentId: string;
  copyText?: string;
};
