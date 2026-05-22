import { useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { Header } from '@/components/Header';
import { ReceiptForm } from '@/components/ReceiptForm';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { SavedReceipts } from '@/components/SavedReceipts';
import { GradientCanvas } from '@/components/GradientCanvas';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { ToastContainer } from '@/components/ui/custom/ToastContainer';
import { PinLock } from '@/components/PinLock';
import { FileText, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './App.css';

function AppContent() {
  const { state, dispatch } = useApp();
  const { isMobile, currentReceipt } = state;  // ✅ Removed unused 'settings'
  // Only use what's needed
}

  // BUG FIX: PIN lock is now set in getInitialState — no need for this effect.
  // Removed the old effect which had missing deps and ran after render.

  // BUG FIX: Use a ref to get the visible receipt card for PDF/image capture.
  // Previously used document.getElementById which found the HIDDEN print-area element first,
  // causing blank exports.
  const captureRef = useRef<HTMLDivElement>(null);

  // PDF download handler
  const handleDownloadPDF = useCallback(() => {
    const el = captureRef.current;
    if (!el) return;

    // BUG FIX: Reset 3D tilt transform before capture so the image isn't skewed
    const savedTransform = el.style.transform;
    el.style.transform = 'none';

    html2canvas(el, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
      el.style.transform = savedTransform; // restore
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, (canvas.height * 80) / canvas.width + 10],
      });
      pdf.addImage(imgData, 'PNG', 0, 5, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`${currentReceipt.receiptNo || 'receipt'}.pdf`);
    }).catch(() => {
      el.style.transform = savedTransform;
    });
  }, [currentReceipt.receiptNo]);

  // Image download handler
  const handleDownloadImage = useCallback(() => {
    const el = captureRef.current;
    if (!el) return;

    // BUG FIX: Reset 3D tilt transform before capture
    const savedTransform = el.style.transform;
    el.style.transform = 'none';

    html2canvas(el, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
      el.style.transform = savedTransform;
      const link = document.createElement('a');
      link.download = `${currentReceipt.receiptNo || 'receipt'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(() => {
      el.style.transform = savedTransform;
    });
  }, [currentReceipt.receiptNo]);

  // Listen for download events from header
  useEffect(() => {
    const handlePdfEvent = () => handleDownloadPDF();
    const handleImgEvent = () => handleDownloadImage();
    window.addEventListener('download-pdf', handlePdfEvent);
    window.addEventListener('download-image', handleImgEvent);
    return () => {
      window.removeEventListener('download-pdf', handlePdfEvent);
      window.removeEventListener('download-image', handleImgEvent);
    };
  }, [handleDownloadPDF, handleDownloadImage]);

  // Print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body > *:not(#print-area) { display: none !important; }
        #print-area { display: block !important; }
        #print-area * { transform: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <>
      {/* PIN Lock */}
      {state.pinLocked && <PinLock />}

      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />

        {/* Print-only area — BUG FIX: uses id="receipt-print-card" so it doesn't
            conflict with the visible card's id used for PDF/image capture */}
        <div id="print-area" className="hidden print:block">
          <ReceiptPreview cardId="receipt-print-card" />
        </div>

        {/* Main content */}
        <div className="non-print pt-16">
          {isMobile ? (
            <MobileLayout captureRef={captureRef} dispatch={dispatch} />
          ) : (
            <DesktopLayout captureRef={captureRef} />
          )}
        </div>

        <SettingsDrawer />
        <ToastContainer />
      </div>
    </>
  );
}

function DesktopLayout({ captureRef }: { captureRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="grid grid-cols-[55%_45%] h-[calc(100vh-64px)]">
      {/* Left: Form */}
      <div className="overflow-y-auto p-6 lg:p-8">
        <ReceiptForm />
        <div className="max-w-3xl mx-auto">
          <SavedReceipts />
        </div>
      </div>

      {/* Right: Preview */}
      <div className="relative overflow-y-auto">
        <GradientCanvas />
        <div className="relative z-10 flex items-center justify-center min-h-full p-8">
          <div className="w-full max-w-md">
            {/* BUG FIX: captureRef points here — this is the VISIBLE element for export */}
            <ReceiptPreview captureRef={captureRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLayout({ captureRef }: { captureRef: React.RefObject<HTMLDivElement | null> }) {
  const { state, dispatch } = useApp();
  const { mobileTab } = state;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Tab Switcher */}
      <div className="shrink-0 flex items-center gap-1 p-2 bg-white border-b border-gray-200">
        <button
          onClick={() => dispatch({ type: 'SET_MOBILE_TAB', payload: 'form' })}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${
            mobileTab === 'form' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={mobileTab === 'form' ? { backgroundColor: state.settings.general.primaryColor } : {}}
        >
          <FileText className="w-4 h-4" />
          Form
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_MOBILE_TAB', payload: 'preview' })}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${
            mobileTab === 'preview' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={mobileTab === 'preview' ? { backgroundColor: state.settings.general.primaryColor } : {}}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mobileTab === 'form' ? (
          <div className="p-4">
            <ReceiptForm />
            <SavedReceipts />
          </div>
        ) : (
          <div className="p-4 bg-white">
            {/* BUG FIX: captureRef also attached here when in mobile preview mode */}
            <ReceiptPreview captureRef={captureRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
