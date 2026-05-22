export interface LineItem {
  id: string;
  particular: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  date: string;
  customerName: string;
  lineItems: LineItem[];
  subtotal: number;
  grandTotal: number;
  totalInWords: string;
  createdAt: number;
  updatedAt: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  city: string;
  district: string;
  pincode: string;
  mobile1: string;
  mobile2: string;
  contactPerson: string;
  gstNumber: string;
}

export interface ReceiptNumberConfig {
  prefix: string;
  separator: string;
  yearFormat: 'YYYY' | 'YY';
  startNumber: number;
  padding: number;
}

export interface GeneralSettings {
  theme: 'light' | 'dark';
  primaryColor: string;
  currency: string;
  currencySymbol: string;
  language: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  autoSave: boolean;
  autoGeneratePdfImage: boolean;
  showSuccessToast: boolean;
  confirmBeforeDeleting: boolean;
  itemsPerPage: number;
  defaultQuantity: number;
  defaultUnit: string;
  defaultRate: number;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pin: string | null;
}

export interface GoogleDriveSettings {
  connected: boolean;
  email: string | null;
  autoSync: boolean;
  lastSynced: number | null;
}

export interface AppSettings {
  general: GeneralSettings;
  company: CompanyProfile;
  receiptNumber: ReceiptNumberConfig;
  security: SecuritySettings;
  googleDrive: GoogleDriveSettings;
}

export type SettingsTab =
  | 'general'
  | 'company'
  | 'receipt'
  | 'numbering'
  | 'drive'
  | 'backup'
  | 'security'
  | 'about';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
