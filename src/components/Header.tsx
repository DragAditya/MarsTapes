// BUG FIX: Added ReactNode import — was missing, causing TS error with React.ReactNode type
import type { ReactNode } from 'react';
import { useApp } from '@/store/AppContext';
import { Receipt, Settings, Share2, Printer, Download, Image, Save } from 'lucide-react';

export function Header() {
  const { state, dispatch } = useApp();
  const { settings, currentReceipt } = state;

  const handleShare = async () => {
    const text = `Receipt ${currentReceipt.receiptNo} from ${settings.company.name}\nCustomer: ${currentReceipt.customerName}\nTotal: ${settings.general.currencySymbol}${currentReceipt.grandTotal.toFixed(2)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Receipt', text });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Receipt copied to clipboard', type: 'success' } });
      } catch {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Could not copy to clipboard', type: 'error' } });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Generating PDF…', type: 'info' } });
    window.dispatchEvent(new CustomEvent('download-pdf'));
  };

  const handleDownloadImage = () => {
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Generating image…', type: 'info' } });
    window.dispatchEvent(new CustomEvent('download-image'));
  };

  const handleSave = () => {
    if (!currentReceipt.customerName.trim() && currentReceipt.lineItems.length === 0) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Add a customer name or items before saving', type: 'error' } });
      return;
    }
    dispatch({ type: 'SAVE_RECEIPT' });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Receipt saved! Starting new receipt.', type: 'success' } });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="h-full max-w-[1920px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: settings.general.primaryColor + '15' }}>
            <Receipt className="w-5 h-5" style={{ color: settings.general.primaryColor }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 truncate leading-tight">Mars Enterprise &middot; Pro Receipt</h1>
            <p className="text-[11px] text-gray-500 hidden sm:block">Premium Receipt Generator</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
            <ActionButton icon={<Save className="w-3.5 h-3.5" />} label="Save" onClick={handleSave} primaryColor={settings.general.primaryColor} />
            <ActionButton icon={<Share2 className="w-3.5 h-3.5" />} label="Share" onClick={handleShare} primaryColor={settings.general.primaryColor} />
            <ActionButton icon={<Printer className="w-3.5 h-3.5" />} label="Print" onClick={handlePrint} primaryColor={settings.general.primaryColor} />
            <ActionButton icon={<Download className="w-3.5 h-3.5" />} label="PDF" onClick={handleDownloadPDF} primaryColor={settings.general.primaryColor} />
            <ActionButton icon={<Image className="w-3.5 h-3.5" />} label="Image" onClick={handleDownloadImage} primaryColor={settings.general.primaryColor} />
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: true })}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}

// BUG FIX: Changed React.ReactNode to ReactNode (React not imported as namespace here)
function ActionButton({ icon, label, onClick, primaryColor }: { icon: ReactNode; label: string; onClick: () => void; primaryColor: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded-md transition-colors"
      onMouseEnter={e => (e.currentTarget.style.color = primaryColor)}
      onMouseLeave={e => (e.currentTarget.style.color = '')}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
