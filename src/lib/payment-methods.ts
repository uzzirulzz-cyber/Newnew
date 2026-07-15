// Manual payment method configuration for Playbeat Digital.
// Source: github.com/uzzirulzz-cyber/gateways

export type ManualMethodId = 'bank-alfalah' | 'easypaisa';
export type MethodId = ManualMethodId | 'jazzcash' | 'paypal' | 'crypto';

export interface ManualMethod {
  id: ManualMethodId;
  label: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  currency: string;
  instructions: string[];
}

export function getManualMethods(): ManualMethod[] {
  return [
    {
      id: 'bank-alfalah',
      label: 'Bank Alfalah',
      bankName: process.env.BANK_ALFALAH_BANK_NAME || 'Bank Alfalah',
      accountTitle: process.env.BANK_ALFALAH_ACCOUNT_TITLE || 'PLAYBEAT DIGITAL (PRIVATE LIMITED)',
      accountNumber: process.env.BANK_ALFALAH_ACCOUNT_NUMBER || '00681011050474',
      iban: process.env.BANK_ALFALAH_IBAN || '',
      currency: process.env.BANK_ALFALAH_CURRENCY || 'PKR',
      instructions: [
        'Open your banking app or visit any Bank Alfalah branch.',
        'Transfer the amount via IBFT / fund transfer / cash deposit.',
        'Copy the transaction reference number (TRN / receipt no.).',
        'Paste it in the form below and submit.',
      ],
    },
    {
      id: 'easypaisa',
      label: 'Easypaisa',
      bankName: process.env.EASYPAISA_BANK_NAME || 'Easypaisa (Telenor Microfinance Bank)',
      accountTitle: process.env.EASYPAISA_ACCOUNT_TITLE || 'Playbeat Digital',
      accountNumber: process.env.EASYPAISA_ACCOUNT_NUMBER || "03390005715",
      iban: process.env.EASYPAISA_IBAN || 'PK25TMFB0000000094799151',
      currency: process.env.EASYPAISA_CURRENCY || 'PKR',
      instructions: [
        'Open the Easypaisa app or visit any Easypaisa shop.',
        'Send money to the Easypaisa account / IBAN below.',
        'Copy the transaction ID from the confirmation SMS or app.',
        'Paste it in the form below and submit.',
      ],
    },
  ].filter((m) => m.accountNumber || m.iban);
}

export function hasManualMethods(): boolean {
  return getManualMethods().length > 0;
}

export function isAdminAuthorized(authHeader: string | null): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  if (!authHeader) return false;
  const trimmed = authHeader.trim();
  if (trimmed === secret) return true;
  if (trimmed.startsWith('Bearer ')) {
    return trimmed.slice(7).trim() === secret;
  }
  return false;
}
