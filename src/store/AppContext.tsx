import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  Receipt,
  AppSettings,
  LineItem,
  Toast,
  SettingsTab,
  ReceiptNumberConfig,
  CompanyProfile,
  GeneralSettings,
  SecuritySettings,
  GoogleDriveSettings,
} from '@/types';
import {
  generateId,
  formatDate,
  generateReceiptNumber,
  extractLastNumber,
  numberToWords,
  DEFAULT_COMPANY,
  DEFAULT_RECEIPT_NUMBER,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
  DEFAULT_GOOGLE_DRIVE_SETTINGS,
} from '@/lib/utils';

// ─── State ───

interface AppState {
  receipts: Receipt[];
  currentReceipt: Receipt;
  settings: AppSettings;
  settingsOpen: boolean;
  activeSettingsTab: SettingsTab;
  toasts: Toast[];
  isMobile: boolean;
  mobileTab: 'form' | 'preview';
  pinLocked: boolean;
  pinAttempts: number;
}

const now = new Date();

function createEmptyReceipt(): Receipt {
  return {
    id: generateId(),
    receiptNo: '',
    date: formatDate(now),
    customerName: '',
    lineItems: [],
    subtotal: 0,
    grandTotal: 0,
    totalInWords: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// BUG FIX: extractLastNumber now uses regex, works with ANY separator
function getMaxReceiptNumber(receipts: Receipt[]): number {
  if (receipts.length === 0) return 0;
  return Math.max(...receipts.map(r => extractLastNumber(r.receiptNo)), 0);
}

function getInitialState(): AppState {
  const savedSettings = localStorage.getItem('proreceipt_settings');
  const savedReceipts = localStorage.getItem('proreceipt_receipts');
  const savedCurrent = localStorage.getItem('proreceipt_current');

  let settings: AppSettings = {
    general: { ...DEFAULT_GENERAL_SETTINGS },
    company: { ...DEFAULT_COMPANY },
    receiptNumber: { ...DEFAULT_RECEIPT_NUMBER },
    security: { ...DEFAULT_SECURITY_SETTINGS },
    googleDrive: { ...DEFAULT_GOOGLE_DRIVE_SETTINGS },
  };

  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      settings = {
        general: { ...DEFAULT_GENERAL_SETTINGS, ...parsed.general },
        company: { ...DEFAULT_COMPANY, ...parsed.company },
        receiptNumber: { ...DEFAULT_RECEIPT_NUMBER, ...parsed.receiptNumber },
        security: { ...DEFAULT_SECURITY_SETTINGS, ...parsed.security },
        googleDrive: { ...DEFAULT_GOOGLE_DRIVE_SETTINGS, ...parsed.googleDrive },
      };
    } catch { /* ignore */ }
  }

  let receipts: Receipt[] = [];
  if (savedReceipts) {
    try { receipts = JSON.parse(savedReceipts); } catch { /* ignore */ }
  }

  let currentReceipt = createEmptyReceipt();
  if (savedCurrent) {
    try { currentReceipt = JSON.parse(savedCurrent); } catch { /* ignore */ }
  }

  // Auto-generate receipt number if empty
  if (!currentReceipt.receiptNo) {
    const lastNum = getMaxReceiptNumber(receipts) || settings.receiptNumber.startNumber;
    currentReceipt.receiptNo = generateReceiptNumber(settings.receiptNumber, lastNum);
  }

  return {
    receipts,
    currentReceipt,
    settings,
    settingsOpen: false,
    activeSettingsTab: 'general',
    toasts: [],
    isMobile: window.innerWidth < 768,
    mobileTab: 'form',
    // BUG FIX: only lock if pin is actually set
    pinLocked: settings.security.pinEnabled && !!settings.security.pin,
    pinAttempts: 0,
  };
}

// ─── Actions ───

type Action =
  | { type: 'SET_CURRENT_RECEIPT'; payload: Partial<Receipt> }
  | { type: 'ADD_LINE_ITEM'; payload?: LineItem }
  | { type: 'UPDATE_LINE_ITEM'; payload: { id: string; field: keyof LineItem; value: string | number } }
  | { type: 'REMOVE_LINE_ITEM'; payload: string }
  | { type: 'CALCULATE_TOTALS' }
  | { type: 'SAVE_RECEIPT' }
  | { type: 'LOAD_RECEIPT'; payload: string }
  | { type: 'RESET_RECEIPT' }
  | { type: 'DELETE_RECEIPT'; payload: string }
  | { type: 'TOGGLE_SETTINGS'; payload?: boolean }
  | { type: 'SET_SETTINGS_TAB'; payload: SettingsTab }
  | { type: 'UPDATE_SETTINGS_GENERAL'; payload: Partial<GeneralSettings> }
  | { type: 'UPDATE_SETTINGS_COMPANY'; payload: Partial<CompanyProfile> }
  | { type: 'UPDATE_SETTINGS_NUMBERING'; payload: Partial<ReceiptNumberConfig> }
  | { type: 'UPDATE_SETTINGS_SECURITY'; payload: Partial<SecuritySettings> }
  | { type: 'UPDATE_SETTINGS_DRIVE'; payload: Partial<GoogleDriveSettings> }
  | { type: 'RESET_ALL_SETTINGS' }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'SET_MOBILE_TAB'; payload: 'form' | 'preview' }
  | { type: 'SET_PIN_LOCKED'; payload: boolean }
  | { type: 'IMPORT_RECEIPTS'; payload: Receipt[] }
  | { type: 'IMPORT_SETTINGS'; payload: AppSettings };

// ─── Reducer ───

function calculateTotals(state: AppState): Receipt {
  const { currentReceipt } = state;
  const items = currentReceipt.lineItems.map(item => ({
    ...item,
    amount: item.qty * item.rate,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    ...currentReceipt,
    lineItems: items,
    subtotal,
    grandTotal: subtotal,
    totalInWords: numberToWords(subtotal),
    updatedAt: Date.now(),
  };
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CURRENT_RECEIPT':
      return { ...state, currentReceipt: { ...state.currentReceipt, ...action.payload, updatedAt: Date.now() } };

    case 'ADD_LINE_ITEM': {
      const newItem: LineItem = action.payload || {
        id: generateId(),
        particular: '',
        qty: state.settings.general.defaultQuantity,
        unit: state.settings.general.defaultUnit,
        rate: state.settings.general.defaultRate,
        amount: 0,
      };
      const updated = { ...state, currentReceipt: { ...state.currentReceipt, lineItems: [...state.currentReceipt.lineItems, newItem] } };
      return appReducer(updated, { type: 'CALCULATE_TOTALS' });
    }

    case 'UPDATE_LINE_ITEM': {
      // BUG FIX: simplified amount calculation — CALCULATE_TOTALS handles it correctly anyway
      const items = state.currentReceipt.lineItems.map(item => {
        if (item.id !== action.payload.id) return item;
        const updated = { ...item, [action.payload.field]: action.payload.value };
        updated.amount = updated.qty * updated.rate;
        return updated;
      });
      const updated = { ...state, currentReceipt: { ...state.currentReceipt, lineItems: items } };
      return appReducer(updated, { type: 'CALCULATE_TOTALS' });
    }

    case 'REMOVE_LINE_ITEM': {
      const items = state.currentReceipt.lineItems.filter(item => item.id !== action.payload);
      const updated = { ...state, currentReceipt: { ...state.currentReceipt, lineItems: items } };
      return appReducer(updated, { type: 'CALCULATE_TOTALS' });
    }

    case 'CALCULATE_TOTALS':
      return { ...state, currentReceipt: calculateTotals(state) };

    case 'SAVE_RECEIPT': {
      const receipt = calculateTotals(state);
      const existingIndex = state.receipts.findIndex(r => r.id === receipt.id);
      let newReceipts: Receipt[];
      if (existingIndex >= 0) {
        newReceipts = [...state.receipts];
        newReceipts[existingIndex] = receipt;
      } else {
        newReceipts = [receipt, ...state.receipts];
      }

      // BUG FIX: use extractLastNumber (regex-based) instead of hardcoded '-' split
      const lastNum = getMaxReceiptNumber(newReceipts);
      const newReceipt = createEmptyReceipt();
      newReceipt.receiptNo = generateReceiptNumber(state.settings.receiptNumber, lastNum);

      return {
        ...state,
        receipts: newReceipts,
        currentReceipt: newReceipt,
      };
    }

    case 'LOAD_RECEIPT': {
      const receipt = state.receipts.find(r => r.id === action.payload);
      if (!receipt) return state;
      return { ...state, currentReceipt: { ...receipt, updatedAt: Date.now() } };
    }

    case 'RESET_RECEIPT': {
      // BUG FIX: use extractLastNumber (regex-based)
      const lastNum = getMaxReceiptNumber(state.receipts);
      const newReceipt = createEmptyReceipt();
      newReceipt.receiptNo = generateReceiptNumber(state.settings.receiptNumber, lastNum);
      return { ...state, currentReceipt: newReceipt };
    }

    case 'DELETE_RECEIPT':
      return { ...state, receipts: state.receipts.filter(r => r.id !== action.payload) };

    case 'TOGGLE_SETTINGS':
      return { ...state, settingsOpen: action.payload !== undefined ? action.payload : !state.settingsOpen };

    case 'SET_SETTINGS_TAB':
      return { ...state, activeSettingsTab: action.payload };

    case 'UPDATE_SETTINGS_GENERAL':
      return { ...state, settings: { ...state.settings, general: { ...state.settings.general, ...action.payload } } };

    case 'UPDATE_SETTINGS_COMPANY':
      return { ...state, settings: { ...state.settings, company: { ...state.settings.company, ...action.payload } } };

    case 'UPDATE_SETTINGS_NUMBERING':
      return { ...state, settings: { ...state.settings, receiptNumber: { ...state.settings.receiptNumber, ...action.payload } } };

    case 'UPDATE_SETTINGS_SECURITY':
      return { ...state, settings: { ...state.settings, security: { ...state.settings.security, ...action.payload } } };

    case 'UPDATE_SETTINGS_DRIVE':
      return { ...state, settings: { ...state.settings, googleDrive: { ...state.settings.googleDrive, ...action.payload } } };

    case 'RESET_ALL_SETTINGS':
      return {
        ...state,
        settings: {
          general: { ...DEFAULT_GENERAL_SETTINGS },
          company: { ...DEFAULT_COMPANY },
          receiptNumber: { ...DEFAULT_RECEIPT_NUMBER },
          security: { ...DEFAULT_SECURITY_SETTINGS },
          googleDrive: { ...DEFAULT_GOOGLE_DRIVE_SETTINGS },
        },
      };

    case 'ADD_TOAST': {
      const toast: Toast = { ...action.payload, id: generateId() };
      return { ...state, toasts: [...state.toasts.slice(-4), toast] };
    }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    case 'SET_MOBILE':
      return { ...state, isMobile: action.payload };

    case 'SET_MOBILE_TAB':
      return { ...state, mobileTab: action.payload };

    case 'SET_PIN_LOCKED':
      return { ...state, pinLocked: action.payload, pinAttempts: action.payload ? state.pinAttempts : 0 };

    case 'IMPORT_RECEIPTS':
      return { ...state, receipts: action.payload };

    case 'IMPORT_SETTINGS':
      return { ...state, settings: action.payload };

    default:
      return state;
  }
}

// ─── Context ───

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, getInitialState);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('proreceipt_settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Persist receipts list to localStorage
  useEffect(() => {
    localStorage.setItem('proreceipt_receipts', JSON.stringify(state.receipts));
  }, [state.receipts]);

  // Persist current in-progress receipt to localStorage
  // BUG FIX: This IS the auto-save. The broken SAVE_RECEIPT dispatch has been removed.
  // The current receipt data is never lost between page refreshes thanks to this effect.
  useEffect(() => {
    localStorage.setItem('proreceipt_current', JSON.stringify(state.currentReceipt));
  }, [state.currentReceipt]);

  // Window resize handler
  useEffect(() => {
    const handler = () => dispatch({ type: 'SET_MOBILE', payload: window.innerWidth < 768 });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
