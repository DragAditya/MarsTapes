import { useState, useCallback } from 'react';
import { useApp } from '@/store/AppContext';
import {
  MessageCircle,
  Download,
  Image as ImageIcon,
  Mail,
  Copy,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareExportModal({ isOpen, onClose }: ShareExportModalProps) {
  const { state, dispatch } = useApp();
  const { currentReceipt, settings } = state;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 2000);
  };

  // Generate PDF
  const handleDownloadPDF = useCallback(async () => {
    setLoading(true);
    try {
      const el = document.getElementById('receipt-preview-card');
      if (!el) {
        dispatch({
          type: 'ADD_TOAST',
          payload: { message: 'Receipt not found', type: 'error' },
        });
        return;
      }

      const savedTransform = (el as HTMLElement).style.transform;
      (el as HTMLElement).style.transform = 'none';

      const canvas = await html2canvas(el as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      (el as HTMLElement).style.transform = savedTransform;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, (canvas.height * 80) / canvas.width + 10],
      });

      pdf.addImage(
        imgData,
        'PNG',
        0,
        5,
        80,
        (canvas.height * 80) / canvas.width
      );
      pdf.save(`${currentReceipt.receiptNo || 'receipt'}.pdf`);
      showSuccess('PDF downloaded!');
    } catch (error) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Failed to generate PDF', type: 'error' },
      });
    } finally {
      setLoading(false);
    }
  }, [currentReceipt.receiptNo, dispatch]);

  // Download as Image
  const handleDownloadImage = useCallback(async () => {
    setLoading(true);
    try {
      const el = document.getElementById('receipt-preview-card');
      if (!el) {
        dispatch({
          type: 'ADD_TOAST',
          payload: { message: 'Receipt not found', type: 'error' },
        });
        return;
      }

      const savedTransform = (el as HTMLElement).style.transform;
      (el as HTMLElement).style.transform = 'none';

      const canvas = await html2canvas(el as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      (el as HTMLElement).style.transform = savedTransform;

      const link = document.createElement('a');
      link.download = `${currentReceipt.receiptNo || 'receipt'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showSuccess('Image downloaded!');
    } catch (error) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Failed to generate image', type: 'error' },
      });
    } finally {
      setLoading(false);
    }
  }, [currentReceipt.receiptNo, dispatch]);

  // Share via WhatsApp
const handleShareWhatsApp = useCallback(async () => {
  setLoading(true);

  try {
    const message = `Receipt No: ${currentReceipt.receiptNo}
Customer: ${currentReceipt.customerName}
Amount: ${settings.general.currencySymbol}${currentReceipt.grandTotal.toFixed(2)}
Date: ${currentReceipt.date}

From: ${settings.company.name}
${settings.company.address}
${settings.company.mobile1}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    showSuccess('Opening WhatsApp...');
  } catch (error) {
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        message: 'Failed to prepare WhatsApp',
        type: 'error',
      },
    });
  } finally {
    setLoading(false);
  }
}, [currentReceipt, settings, dispatch]);

  // Copy to Clipboard (text format)
  const handleCopyClipboard = useCallback(async () => {
    try {
      const text = `Receipt No: ${currentReceipt.receiptNo}
Customer: ${currentReceipt.customerName}
Date: ${currentReceipt.date}
Total Amount: ${settings.general.currencySymbol}${currentReceipt.grandTotal.toFixed(2)}

Items:
${currentReceipt.lineItems
  .map(
    (item, i) =>
      `${i + 1}. ${item.particular} - Qty: ${item.qty} ${item.unit} @ ${settings.general.currencySymbol}${item.rate.toFixed(2)} = ${settings.general.currencySymbol}${item.amount.toFixed(2)}`
  )
  .join('\n')}

Company: ${settings.company.name}
Address: ${settings.company.address}
Mobile: ${settings.company.mobile1}`;

      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard!');
    } catch (error) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Failed to copy', type: 'error' },
      });
    }
  }, [currentReceipt, settings, dispatch]);

  // Email (Opens default email client)
  const handleEmailReceipt = useCallback(() => {
    try {
      const subject = `Receipt ${currentReceipt.receiptNo}`;
      const body = `Hello,

Please find the receipt details below:

Receipt No: ${currentReceipt.receiptNo}
Date: ${currentReceipt.date}
Customer: ${currentReceipt.customerName}

Amount: ${settings.general.currencySymbol}${currentReceipt.grandTotal.toFixed(2)}

Company: ${settings.company.name}
${settings.company.address}
Mobile: ${settings.company.mobile1}

Thank you!`;

      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      showSuccess('Opening email client...');
    } catch (error) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Failed to open email', type: 'error' },
      });
    }
  }, [currentReceipt, settings, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Share Receipt</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Receipt Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Receipt No:</span>{' '}
            {currentReceipt.receiptNo}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold">Customer:</span>{' '}
            {currentReceipt.customerName || 'N/A'}
          </p>
          <p className="text-lg font-bold mt-2" style={{ color: settings.general.primaryColor }}>
            {settings.general.currencySymbol}
            {currentReceipt.grandTotal.toFixed(2)}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-green-500" />
            ) : (
              <MessageCircle className="w-5 h-5 text-green-500" />
            )}
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </button>

          {/* PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-red-500" />
            ) : (
              <Download className="w-5 h-5 text-red-500" />
            )}
            <span className="text-xs font-medium text-gray-700">PDF</span>
          </button>

          {/* Image */}
          <button
            onClick={handleDownloadImage}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            ) : (
              <ImageIcon className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-xs font-medium text-gray-700">Image</span>
          </button>

          {/* Email */}
          <button
            onClick={handleEmailReceipt}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            ) : (
              <Mail className="w-5 h-5 text-purple-500" />
            )}
            <span className="text-xs font-medium text-gray-700">Email</span>
          </button>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopyClipboard}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Copy Text
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-3 p-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
