import { useRef, useEffect } from 'react';
import { useApp } from '@/store/AppContext';

interface ReceiptPreviewProps {
  // BUG FIX: Accept a ref from the parent so App.tsx can target the correct (visible) element
  // for html2canvas capture. No longer uses hardcoded id="receipt-preview-card" on every instance.
  captureRef?: React.RefObject<HTMLDivElement | null>;
  // BUG FIX: Accept custom id for the print-area variant (prevents duplicate IDs in DOM)
  cardId?: string;
}

export function ReceiptPreview({ captureRef, cardId }: ReceiptPreviewProps) {
  const { state } = useApp();
  const { currentReceipt, settings } = state;
  const { company, general } = settings;
  const internalRef = useRef<HTMLDivElement>(null);

  // Use the external ref if provided, otherwise our internal one
  const cardRef = (captureRef as React.RefObject<HTMLDivElement>) ?? internalRef;

  // 3D tilt effect — only on the visible card (when captureRef provided)
  useEffect(() => {
    // Skip tilt on the print-area version (no captureRef)
    if (!captureRef) return;

    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [captureRef, cardRef]);

  return (
    <div className="w-full max-w-lg mx-auto" style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        className="relative transition-transform duration-100 ease-out"
        id={cardId}
      >
        {/* Zig-zag top */}
        <div className="receipt-edge-top" />

        {/* Receipt body */}
        <div className="bg-white px-6 sm:px-8 py-6">
          {/* Company Header */}
          <div className="text-center mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wide" style={{ color: general.primaryColor }}>
              {company.name}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {company.address} - {company.pincode} (Dist- {company.district})
            </p>
            <div className="flex items-center justify-center gap-4 mt-1 text-xs text-gray-600">
              <span>Mob. {company.mobile1}</span>
              <span>{company.contactPerson}</span>
              <span>Mob. {company.mobile2}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-0 my-3">
            <span style={{ color: general.primaryColor }} className="text-sm">&#9670;</span>
            <div className="flex-1 border-b border-dashed border-gray-400 mx-1" />
            <span style={{ color: general.primaryColor }} className="text-sm">&#9670;</span>
          </div>

          {/* Receipt Meta */}
          <div className="flex justify-between text-xs text-gray-800 mb-4">
            <span><span className="font-semibold">Date:</span> {currentReceipt.date}</span>
            <span><span className="font-semibold">Receipt No:</span> <span style={{ color: general.primaryColor }} className="font-bold">{currentReceipt.receiptNo}</span></span>
          </div>

          {/* Customer */}
          <div className="mb-4">
            <span className="text-sm font-semibold text-gray-800">M/s.</span>
            <div className="border-b border-gray-800 mt-1 h-5 text-sm text-gray-800">
              {currentReceipt.customerName}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-t border-b border-gray-800">
                <th className="py-1.5 text-center font-semibold text-gray-800 w-8">No.</th>
                <th className="py-1.5 text-left font-semibold text-gray-800">Particulars</th>
                <th className="py-1.5 text-center font-semibold text-gray-800 w-12">Qty</th>
                <th className="py-1.5 text-center font-semibold text-gray-800 w-12">Unit</th>
                <th className="py-1.5 text-right font-semibold text-gray-800 w-20">Rate ({general.currencySymbol})</th>
                <th className="py-1.5 text-right font-semibold text-gray-800 w-20">Amount ({general.currencySymbol})</th>
              </tr>
            </thead>
            <tbody>
              {currentReceipt.lineItems.length === 0 ? (
                <tr className="border-b border-gray-300">
                  <td className="py-2 text-center text-gray-400">-</td>
                  <td className="py-2 text-gray-400 italic">No items</td>
                  <td className="py-2 text-center text-gray-400">-</td>
                  <td className="py-2 text-center text-gray-400">-</td>
                  <td className="py-2 text-right text-gray-400">-</td>
                  <td className="py-2 text-right text-gray-400">-</td>
                </tr>
              ) : (
                currentReceipt.lineItems.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="py-1.5 text-center text-gray-700">{i + 1}</td>
                    <td className="py-1.5 text-gray-700">{item.particular || '-'}</td>
                    <td className="py-1.5 text-center text-gray-700">{item.qty}</td>
                    <td className="py-1.5 text-center text-gray-700">{item.unit}</td>
                    <td className="py-1.5 text-right text-gray-700 font-mono">{item.rate.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-gray-700 font-mono">{item.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-3">
            <div className="text-right">
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Subtotal :</span>{' '}
                <span className="font-mono">{currentReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="text-base font-bold mt-1" style={{ color: general.primaryColor }}>
                Total {general.currencySymbol} : {currentReceipt.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* BUG FIX: Only show "In Words" when there's actually a non-zero total */}
          {currentReceipt.totalInWords && currentReceipt.grandTotal > 0 && (
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-800">In Words Rs. </span>
              <span className="text-xs text-gray-700 italic">{currentReceipt.totalInWords} Rupees Only</span>
            </div>
          )}

          {/* Signature */}
          <div className="flex justify-end mt-6">
            <div className="text-center">
              <div className="border-b border-gray-800 w-40 mb-1" />
              <span className="text-xs text-gray-600">Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Zig-zag bottom */}
        <div className="receipt-edge-bottom" />
      </div>
    </div>
  );
}
