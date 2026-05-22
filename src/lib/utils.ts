import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertToWordsLessThanThousand(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ones[num];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  }
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertToWordsLessThanThousand(remainder) : '');
}

export function numberToWords(num: number): string {
  if (num <= 0) return '';
  if (num < 0) return 'Minus ' + numberToWords(-num);

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = '';
  let remaining = integerPart;

  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    result += convertToWordsLessThanThousand(crores) + ' Crore';
    remaining %= 10000000;
    if (remaining > 0) result += ' ';
  }

  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    result += convertToWordsLessThanThousand(lakhs) + ' Lakh';
    remaining %= 100000;
    if (remaining > 0) result += ' ';
  }

  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    result += convertToWordsLessThanThousand(thousands) + ' Thousand';
    remaining %= 1000;
    if (remaining > 0) result += ' ';
  }

  if (remaining > 0) {
    result += convertToWordsLessThanThousand(remaining);
  }

  if (decimalPart > 0) {
    result += ' and ' + convertToWordsLessThanThousand(decimalPart) + ' Paise';
  }

  return result.trim();
}

export function formatDate(date: Date, format: string = 'DD/MM/YYYY'): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  switch (format) {
    case 'MM/DD/YYYY':
      return `${m}/${d}/${y}`;
    case 'YYYY-MM-DD':
      return `${y}-${m}-${d}`;
    case 'DD/MM/YYYY':
    default:
      return `${d}/${m}/${y}`;
  }
}

// BUG FIX: Extract last numeric segment using regex so it works for ANY separator (-, /, _, .)
export function extractLastNumber(receiptNo: string): number {
  const match = /(\d+)$/.exec(receiptNo);
  return match ? parseInt(match[1], 10) : 0;
}

export function generateReceiptNumber(
  config: { prefix: string; separator: string; yearFormat: 'YYYY' | 'YY'; padding: number },
  lastNumber: number
): string {
  const now = new Date();
  const year = config.yearFormat === 'YY'
    ? String(now.getFullYear()).slice(-2)
    : String(now.getFullYear());
  // BUG FIX: was hardcoded padStart(3), now uses config.padding
  const nextNum = String(lastNumber + 1).padStart(config.padding, '0');
  return `${config.prefix}${config.separator}${year}${config.separator}${nextNum}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const UNITS = ['Roll', 'Pcs', 'Kg', 'Mtr', 'Box', 'Set', 'Pkt', 'Ltr', 'Gm', 'Ft', 'Bag', 'Bundle'];

export const DEFAULT_COMPANY: CompanyProfile = {
  name: 'Mars Enterprise',
  address: 'Amalner',
  city: 'Amalner',
  district: 'Jalgaon',
  pincode: '425401',
  mobile1: '9049697228',
  mobile2: '7378999967',
  contactPerson: 'Shri',
  gstNumber: '',
};

export const DEFAULT_RECEIPT_NUMBER: ReceiptNumberConfig = {
  prefix: 'MRS',
  separator: '-',
  yearFormat: 'YYYY',
  startNumber: 0,
  padding: 3,
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  theme: 'light',
  primaryColor: '#B23C5C',
  currency: 'INR',
  currencySymbol: '\u20B9',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  autoSave: true,
  autoGeneratePdfImage: true,
  showSuccessToast: true,
  confirmBeforeDeleting: true,
  itemsPerPage: 10,
  defaultQuantity: 1,
  defaultUnit: 'Roll',
  defaultRate: 0,
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pinEnabled: false,
  pin: null,
};

export const DEFAULT_GOOGLE_DRIVE_SETTINGS: GoogleDriveSettings = {
  connected: false,
  email: null,
  autoSync: true,
  lastSynced: null,
};

import type { CompanyProfile, ReceiptNumberConfig, GeneralSettings, SecuritySettings, GoogleDriveSettings } from '@/types';
