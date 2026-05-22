import { useApp } from '@/store/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Settings, Building2, FileText, Hash, Cloud, Database,
  Shield, Info, Sliders, Palette, Globe, Calendar,
  Trash2, Download, Upload, Lock, Smartphone, CheckCircle, Receipt
} from 'lucide-react';
import type { SettingsTab, GeneralSettings, CompanyProfile, ReceiptNumberConfig, GoogleDriveSettings } from '@/types';
import { useRef, useState } from 'react';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" />, desc: 'Basic preferences & behavior' },
  { id: 'company', label: 'Company Profile', icon: <Building2 className="w-4 h-4" />, desc: 'Business details & branding' },
  { id: 'receipt', label: 'Receipt Settings', icon: <FileText className="w-4 h-4" />, desc: 'Defaults for receipts' },
  { id: 'numbering', label: 'Numbering', icon: <Hash className="w-4 h-4" />, desc: 'Receipt number configuration' },
  { id: 'drive', label: 'Google Drive', icon: <Cloud className="w-4 h-4" />, desc: 'Drive connection & backup' },
  { id: 'backup', label: 'Data & Backup', icon: <Database className="w-4 h-4" />, desc: 'Export, import & local backup' },
  { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" />, desc: 'PIN lock & security options' },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" />, desc: 'App information & version' },
];

export function SettingsDrawer() {
  const { state, dispatch } = useApp();
  const { settingsOpen, activeSettingsTab, settings, isMobile } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => dispatch({ type: 'TOGGLE_SETTINGS', payload: false });

  const handleExport = () => {
    const data = {
      receipts: state.receipts,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proreceipt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Data exported successfully', type: 'success' } });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.receipts) dispatch({ type: 'IMPORT_RECEIPTS', payload: data.receipts });
        if (data.settings) dispatch({ type: 'IMPORT_SETTINGS', payload: data.settings });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Data imported successfully', type: 'success' } });
      } catch {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Invalid backup file', type: 'error' } });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const variants = isMobile
    ? { hidden: { y: '100%' }, visible: { y: 0 }, exit: { y: '100%' } }
    : { hidden: { x: '100%' }, visible: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed z-[70] bg-white shadow-2xl ${
              isMobile ? 'bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl' : 'top-0 right-0 h-full w-[450px] max-w-full'
            }`}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className={`flex-1 overflow-hidden ${isMobile ? 'flex flex-col' : 'flex'}`}>
                {/* Tab Navigation */}
                <div className={`${isMobile ? 'flex overflow-x-auto border-b border-gray-200 p-2 gap-1' : 'w-48 border-r border-gray-200 overflow-y-auto p-2 space-y-0.5'}`}
                  style={isMobile ? { scrollbarWidth: 'none' } : {}}
                >
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => dispatch({ type: 'SET_SETTINGS_TAB', payload: tab.id })}
                      className={`flex items-center gap-2.5 rounded-lg transition-all text-left ${
                        isMobile
                          ? `px-3 py-2 shrink-0 text-xs font-medium ${activeSettingsTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`
                          : `w-full px-3 py-2.5 text-sm ${activeSettingsTab === tab.id ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
                      }`}
                      style={activeSettingsTab === tab.id && isMobile ? { backgroundColor: settings.general.primaryColor } : {}}
                    >
                      <span className={isMobile ? '' : 'text-gray-400'}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-5">
                  {activeSettingsTab === 'general' && <GeneralSettingsPanel />}
                  {activeSettingsTab === 'company' && <CompanySettingsPanel />}
                  {activeSettingsTab === 'receipt' && <ReceiptSettingsPanel />}
                  {activeSettingsTab === 'numbering' && <NumberingSettingsPanel />}
                  {activeSettingsTab === 'drive' && <DriveSettingsPanel />}
                  {activeSettingsTab === 'backup' && <BackupSettingsPanel onExport={handleExport} onImport={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} handleImport={handleImport} />}
                  {activeSettingsTab === 'security' && <SecuritySettingsPanel />}
                  {activeSettingsTab === 'about' && <AboutSettingsPanel />}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── General Settings ───

function GeneralSettingsPanel() {
  const { state, dispatch } = useApp();
  const { general } = state.settings;

  const update = (partial: Partial<GeneralSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS_GENERAL', payload: partial });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">General Settings</h3>
        <p className="text-xs text-gray-500">Customize the behavior and preferences of the application.</p>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-800">Appearance</h4>
        </div>
        <p className="text-xs text-gray-500">Choose the theme and visual preferences.</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Theme</label>
            <select
              value={general.theme}
              onChange={e => update({ theme: e.target.value as 'light' | 'dark' })}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            >
              <option value="light">Light (Default)</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={general.primaryColor}
                onChange={e => update({ primaryColor: e.target.value })}
                className="w-9 h-9 border border-gray-200 rounded-md cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-600">{general.primaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Currency & Language */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-800">Currency & Language</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <select
              value={general.currency}
              onChange={e => {
                const map: Record<string, string> = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
                update({ currency: e.target.value, currencySymbol: map[e.target.value] || '\u20B9' });
              }}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            >
              <option value="INR">INR (&#8377;) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (&euro;) - Euro</option>
              <option value="GBP">GBP (&pound;) - British Pound</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
            <select
              value={general.language}
              onChange={e => update({ language: e.target.value })}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Format */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-800">Date Format</h4>
        </div>
        <p className="text-xs text-gray-500">Choose the date format for your receipts.</p>
        <div className="space-y-2">
          {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
            <label key={fmt} className="flex items-center gap-2.5 cursor-pointer">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${general.dateFormat === fmt ? 'border-current' : 'border-gray-300'}`}
                style={general.dateFormat === fmt ? { color: general.primaryColor, borderColor: general.primaryColor } : {}}
              >
                {general.dateFormat === fmt && <div className="w-2 h-2 rounded-full bg-current" />}
              </div>
              <span className="text-sm text-gray-700">{fmt}</span>
              <span className="text-xs text-gray-400">
                ({fmt === 'DD/MM/YYYY' ? '24/05/2025' : fmt === 'MM/DD/YYYY' ? '05/24/2025' : '2025-05-24'})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Application Preferences */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-800">Application Preferences</h4>
        </div>
        <p className="text-xs text-gray-500">Control general app behavior.</p>

        <div className="space-y-3">
          <Toggle label="Auto save receipts" desc="Automatically save receipts to Google Drive"
            checked={general.autoSave} onChange={v => update({ autoSave: v })} />
          <Toggle label="Auto generate PDF & Image" desc="Generate PDF and Image when receipt is shared"
            checked={general.autoGeneratePdfImage} onChange={v => update({ autoGeneratePdfImage: v })} />
          <Toggle label="Show success toast" desc="Show notifications for actions"
            checked={general.showSuccessToast} onChange={v => update({ showSuccessToast: v })} />
          <Toggle label="Confirm before deleting" desc="Ask for confirmation before deleting items"
            checked={general.confirmBeforeDeleting} onChange={v => update({ confirmBeforeDeleting: v })} />
        </div>
      </div>

      {/* Reset */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={() => {
            if (confirm('Reset all settings to default values?')) {
              dispatch({ type: 'RESET_ALL_SETTINGS' });
              dispatch({ type: 'ADD_TOAST', payload: { message: 'Settings reset to defaults', type: 'success' } });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset All Settings
        </button>
      </div>
    </div>
  );
}

// ─── Company Profile ───

function CompanySettingsPanel() {
  const { state, dispatch } = useApp();
  const { company } = state.settings;

  const update = (partial: Partial<CompanyProfile>) => {
    dispatch({ type: 'UPDATE_SETTINGS_COMPANY', payload: partial });
  };

  const fields: { label: string; key: keyof CompanyProfile; placeholder: string }[] = [
    { label: 'Company Name', key: 'name', placeholder: 'Mars Enterprise' },
    { label: 'Address', key: 'address', placeholder: 'Amalner' },
    { label: 'City', key: 'city', placeholder: 'Amalner' },
    { label: 'District', key: 'district', placeholder: 'Jalgaon' },
    { label: 'Pincode', key: 'pincode', placeholder: '425401' },
    { label: 'Mobile 1', key: 'mobile1', placeholder: '9049697228' },
    { label: 'Mobile 2', key: 'mobile2', placeholder: '7378999967' },
    { label: 'Contact Person', key: 'contactPerson', placeholder: 'Shri' },
    { label: 'GST Number', key: 'gstNumber', placeholder: 'Optional' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Company Profile</h3>
        <p className="text-xs text-gray-500">Business details &amp; branding for your receipts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              type="text"
              placeholder={f.placeholder}
              value={company[f.key]}
              onChange={e => update({ [f.key]: e.target.value })}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Receipt Settings ───

function ReceiptSettingsPanel() {
  const { state, dispatch } = useApp();
  const { general } = state.settings;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Receipt Settings</h3>
        <p className="text-xs text-gray-500">Default values for new receipts.</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-800 mb-3">Default Line Item</h4>
        <p className="text-xs text-gray-500 mb-3">Default values for new line items.</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              value={general.defaultQuantity}
              onChange={e => dispatch({ type: 'UPDATE_SETTINGS_GENERAL', payload: { defaultQuantity: Number(e.target.value) } })}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
            <select
              value={general.defaultUnit}
              onChange={e => dispatch({ type: 'UPDATE_SETTINGS_GENERAL', payload: { defaultUnit: e.target.value } })}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            >
              {['Roll', 'Pcs', 'Kg', 'Mtr', 'Box', 'Set', 'Pkt', 'Ltr', 'Gm', 'Ft', 'Bag', 'Bundle'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rate ({general.currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              value={general.defaultRate}
              onChange={e => dispatch({ type: 'UPDATE_SETTINGS_GENERAL', payload: { defaultRate: Number(e.target.value) } })}
              className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            />
          </div>
        </div>
        <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-xs text-blue-700">These values will be applied when you add a new line item.</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Miscellaneous</h4>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Items per page in history</label>
          <select
            value={general.itemsPerPage}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS_GENERAL', payload: { itemsPerPage: Number(e.target.value) } })}
            className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Numbering ───

function NumberingSettingsPanel() {
  const { state, dispatch } = useApp();
  const { receiptNumber } = state.settings;

  const update = (partial: Partial<ReceiptNumberConfig>) => {
    dispatch({ type: 'UPDATE_SETTINGS_NUMBERING', payload: partial });
  };

  const preview = `${receiptNumber.prefix}${receiptNumber.separator}${receiptNumber.yearFormat === 'YY' ? '25' : '2025'}${receiptNumber.separator}${String(receiptNumber.startNumber + 1).padStart(receiptNumber.padding, '0')}`;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Receipt Numbering</h3>
        <p className="text-xs text-gray-500">Configure how receipt numbers are generated.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prefix</label>
          <input
            type="text"
            value={receiptNumber.prefix}
            onChange={e => update({ prefix: e.target.value.toUpperCase() })}
            className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Separator</label>
          <select
            value={receiptNumber.separator}
            onChange={e => update({ separator: e.target.value })}
            className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          >
            <option value="-">- (Hyphen)</option>
            <option value="/">/ (Slash)</option>
            <option value="_">_ (Underscore)</option>
            <option value=".">. (Dot)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Year Format</label>
          <select
            value={receiptNumber.yearFormat}
            onChange={e => update({ yearFormat: e.target.value as 'YYYY' | 'YY' })}
            className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          >
            <option value="YYYY">YYYY (2025)</option>
            <option value="YY">YY (25)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Number</label>
          <input
            type="number"
            value={receiptNumber.startNumber}
            onChange={e => update({ startNumber: Number(e.target.value) })}
            className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
          <select
            value={receiptNumber.padding}
            onChange={e => update({ padding: Number(e.target.value) })}
            className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          >
            <option value={2}>2 (01)</option>
            <option value={3}>3 (001)</option>
            <option value={4}>4 (0001)</option>
            <option value={5}>5 (00001)</option>
          </select>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-xs text-gray-500">Preview: </span>
        <span className="text-sm font-mono font-medium text-gray-800">{preview}</span>
      </div>
    </div>
  );
}

// ─── Google Drive ───

function DriveSettingsPanel() {
  const { state, dispatch } = useApp();
  const { googleDrive } = state.settings;

  const update = (partial: Partial<GoogleDriveSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS_DRIVE', payload: partial });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Google Drive</h3>
        <p className="text-xs text-gray-500">Connect your Google Drive for cloud backup.</p>
      </div>

      <div className="p-4 border border-gray-200 rounded-xl">
        {googleDrive.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-gray-800">Connected</span>
            </div>
            <p className="text-xs text-gray-500">{googleDrive.email}</p>
            <Toggle label="Auto Sync" desc="Automatically sync to Google Drive"
              checked={googleDrive.autoSync} onChange={v => update({ autoSync: v })} />
            <button
              onClick={() => update({ connected: false, email: null })}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect Account
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Cloud className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">Connect your Google Drive to backup receipts</p>
            <button
              onClick={() => {
                update({ connected: true, email: 'user@gmail.com', lastSynced: Date.now() });
                dispatch({ type: 'ADD_TOAST', payload: { message: 'Google Drive connected', type: 'success' } });
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: state.settings.general.primaryColor }}
            >
              Connect Google Drive
            </button>
          </div>
        )}
      </div>

      {googleDrive.lastSynced && (
        <p className="text-xs text-gray-500">
          Last synced: {new Date(googleDrive.lastSynced).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ─── Data & Backup ───

function BackupSettingsPanel({ onExport, onImport, fileInputRef, handleImport }: {
  onExport: () => void;
  onImport: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { state, dispatch } = useApp();
  const { receipts } = state;

  const handleClearAll = () => {
    if (confirm(`Delete all ${receipts.length} receipts? This cannot be undone.`)) {
      dispatch({ type: 'IMPORT_RECEIPTS', payload: [] });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'All receipts deleted', type: 'info' } });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Data & Backup</h3>
        <p className="text-xs text-gray-500">Export, import &amp; manage your receipt data.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
        <button
          onClick={onImport}
          className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <span className="font-medium">{receipts.length}</span> receipts stored locally
        </p>
        <p className="text-xs text-gray-500 mt-1">
          All data is stored in your browser&apos;s localStorage.
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete All Receipts
        </button>
      </div>
    </div>
  );
}

// ─── Security ───

function SecuritySettingsPanel() {
  const { state, dispatch } = useApp();
  const { security } = state.settings;
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSetPin = () => {
    if (pin.length < 4) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'PIN must be at least 4 digits', type: 'error' } });
      return;
    }
    if (pin !== confirmPin) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'PINs do not match', type: 'error' } });
      return;
    }
    dispatch({ type: 'UPDATE_SETTINGS_SECURITY', payload: { pin, pinEnabled: true } });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'PIN lock enabled', type: 'success' } });
    setPin('');
    setConfirmPin('');
  };

  const handleDisablePin = () => {
    dispatch({ type: 'UPDATE_SETTINGS_SECURITY', payload: { pinEnabled: false, pin: null } });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'PIN lock disabled', type: 'info' } });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Security</h3>
        <p className="text-xs text-gray-500">PIN lock &amp; security options for your receipts.</p>
      </div>

      <Toggle label="Enable PIN Lock" desc="Require PIN to access the app"
        checked={security.pinEnabled} onChange={v => {
          if (!v) handleDisablePin();
        }} />

      {security.pinEnabled && (
        <div className="p-4 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-800">Set PIN</span>
          </div>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter PIN (4-6 digits)"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ ['--tw-ring-color' as string]: state.settings.general.primaryColor + '40' }}
          />
          <button
            onClick={handleSetPin}
            className="w-full h-9 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: state.settings.general.primaryColor }}
          >
            Set PIN
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-800">Device Security</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Your data is stored locally on this device. No data is sent to any server.
        </p>
      </div>
    </div>
  );
}

// ─── About ───

function AboutSettingsPanel() {
  const { state } = useApp();

  return (
    <div className="space-y-5">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: state.settings.general.primaryColor + '15' }}>
          <Receipt className="w-8 h-8" style={{ color: state.settings.general.primaryColor }} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Mars Enterprise</h3>
        <p className="text-sm text-gray-500">Pro Receipt</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Version</span>
          <span className="font-medium text-gray-800">1.0.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Build</span>
          <span className="font-medium text-gray-800">2025.05.24</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Platform</span>
          <span className="font-medium text-gray-800">Web (PWA)</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Mars Enterprise Pro Receipt is a premium receipt generator designed for Indian businesses.
          Create, manage, and share professional receipts with ease.
        </p>
      </div>
    </div>
  );
}

// ─── Toggle Component ───

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { state } = useApp();

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? '' : 'bg-gray-200'}`}
        style={checked ? { backgroundColor: state.settings.general.primaryColor } : {}}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
