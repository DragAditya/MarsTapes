import { useApp } from '@/store/AppContext';
import { Receipt, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

export function SavedReceipts() {
  const { state, dispatch } = useApp();
  const { receipts, settings } = state;
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLoad = (id: string) => {
    dispatch({ type: 'LOAD_RECEIPT', payload: id });
    dispatch({ type: 'SET_MOBILE_TAB', payload: 'form' });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Receipt loaded', type: 'success' } });
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4" style={{ color: settings.general.primaryColor }} />
          <h3 className="text-sm font-semibold text-gray-900">Saved Receipts (Auto-saved to Drive)</h3>
        </div>
        <button
          onClick={() => dispatch({ type: 'ADD_TOAST', payload: { message: 'Receipts refreshed', type: 'success' } })}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      <div className="relative">
        {receipts.length > 4 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {receipts.map(receipt => (
            <button
              key={receipt.id}
              onClick={() => handleLoad(receipt.id)}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all shrink-0 text-left group"
              style={{ ['--hover-color' as string]: settings.general.primaryColor }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = settings.general.primaryColor;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '';
              }}
            >
              <Receipt className="w-4 h-4 shrink-0" style={{ color: settings.general.primaryColor }} />
              <span className="text-xs font-mono font-medium text-gray-700 group-hover:text-gray-900">{receipt.receiptNo}</span>
            </button>
          ))}

          {receipts.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No saved receipts yet.</p>
          )}
        </div>

        {receipts.length > 4 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
        Receipts are automatically saved to Google Drive and backed up locally.
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        <span className="text-emerald-600">All changes saved</span>
      </p>
    </div>
  );
}
