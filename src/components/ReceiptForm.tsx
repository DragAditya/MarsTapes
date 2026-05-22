import { useState, useCallback } from 'react';
import { useApp } from '@/store/AppContext';
import { Plus, Trash2, RotateCcw, Save, List, Calendar, Share2 } from 'lucide-react';
import { UNITS } from '@/lib/utils';
import { ShareExportModal } from '@/components/ShareExportModal';

export function ReceiptForm() {
  const { state, dispatch } = useApp();
  const { currentReceipt, settings } = state;
  const { general } = settings;
  const symbol = general.currencySymbol;
  const [showShareModal, setShowShareModal] = useState(false);

  const handleSave = useCallback(() => {
    if (!currentReceipt.customerName.trim() && currentReceipt.lineItems.length === 0) {
      dispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Add a customer name or items before saving', type: 'error' },
      });
      return;
    }
    dispatch({ type: 'SAVE_RECEIPT' });
    dispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Receipt saved! Starting new receipt.', type: 'success' },
    });
  }, [dispatch, currentReceipt.customerName, currentReceipt.lineItems.length]);

  const handleReset = useCallback(() => {
    if (
      general.confirmBeforeDeleting &&
      (currentReceipt.customerName || currentReceipt.lineItems.length > 0)
    ) {
      if (!confirm('Are you sure you want to reset this receipt?')) return;
    }
    dispatch({ type: 'RESET_RECEIPT' });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Receipt reset', type: 'info' } });
  }, [dispatch, general.confirmBeforeDeleting, currentReceipt]);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto pb-8">
        {/* Receipt Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: general.primaryColor + '12' }}
            >
              <List className="w-4 h-4" style={{ color: general.primaryColor }} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Receipt Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Receipt No. (Auto)
              </label>
              <input
                type="text"
                value={currentReceipt.receiptNo}
                readOnly
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={(() => {
                    const parts = currentReceipt.date.split('/');
                    if (parts.length === 3) {
                      return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return currentReceipt.date;
                  })()}
                  onChange={e => {
                    const [year, month, day] = e.target.value.split('-');
                    if (year && month && day) {
                      dispatch({
                        type: 'SET_CURRENT_RECEIPT',
                        payload: { date: `${day}/${month}/${year}` },
                      });
                    }
                  }}
                  className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow"
                  style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              M/s. (Customer Name)
            </label>
            <input
              type="text"
              placeholder="Customer / Party name"
              value={currentReceipt.customerName}
              onChange={e =>
                dispatch({
                  type: 'SET_CURRENT_RECEIPT',
                  payload: { customerName: e.target.value },
                })
              }
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow"
              style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
            </div>
            <button
              onClick={() => dispatch({ type: 'ADD_LINE_ITEM' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
              style={{
                color: general.primaryColor,
                borderColor: general.primaryColor + '40',
                backgroundColor: general.primaryColor + '08',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = general.primaryColor + '15';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = general.primaryColor + '08';
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_100px_100px_44px] gap-2 text-[11px] font-medium text-gray-500 uppercase tracking-wide px-1 mb-2">
            <span>#</span>
            <span>Particulars</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Unit</span>
            <span className="text-right">Rate ({symbol})</span>
            <span className="text-right">Amount ({symbol})</span>
            <span></span>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            {currentReceipt.lineItems.map((item, index) => (
              <LineItemRow key={item.id} item={item} index={index} />
            ))}

            {currentReceipt.lineItems.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                No items added. Click "Add Row" to add items.
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Subtotal ({symbol})</span>
              <span className="text-sm font-mono text-gray-900">
                {currentReceipt.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">Grand Total ({symbol})</span>
              <span
                className="text-lg font-bold font-mono"
                style={{ color: general.primaryColor }}
              >
                {currentReceipt.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReset}
            className="flex-1 h-11 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          {/* ✨ SHARE / DOWNLOAD BUTTON ✨ */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-white rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: general.primaryColor }}
          >
            <Share2 className="w-4 h-4" />
            Share / Download
          </button>

          <button
            onClick={handleSave}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-white rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: general.primaryColor }}
          >
            <Save className="w-4 h-4" />
            Save Receipt
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Receipt data is auto-saved locally in your browser
        </p>
      </div>

      {/* Share/Export Modal */}
      <ShareExportModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </>
  );
}

function LineItemRow({
  item,
  index,
}: {
  item: { id: string; particular: string; qty: number; unit: string; rate: number; amount: number };
  index: number;
}) {
  const { state, dispatch } = useApp();
  const { general } = state.settings;

  const handleRemove = () => {
    if (general.confirmBeforeDeleting) {
      if (!confirm('Remove this item?')) return;
    }
    dispatch({ type: 'REMOVE_LINE_ITEM', payload: item.id });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[40px_1fr_80px_80px_100px_100px_44px] gap-2 p-2 bg-gray-50/50 rounded-lg border border-gray-100">
      <span className="hidden sm:flex items-center text-xs font-mono text-gray-500">
        {index + 1}
      </span>

      <div className="col-span-1 sm:col-span-1">
        <label className="sm:hidden text-[10px] font-medium text-gray-500 uppercase">
          Particulars
        </label>
        <input
          type="text"
          list="particulars-list"
          value={item.particular}
          onChange={e =>
            dispatch({
              type: 'UPDATE_LINE_ITEM',
              payload: { id: item.id, field: 'particular', value: e.target.value },
            })
          }
          placeholder="Item name"
          className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
        />
        <datalist id="particulars-list">
          <option value="BOPP Self-Adhesive Tape" />
          <option value="Cello Tape" />
          <option value="Masking Tape" />
          <option value="Double Sided Tape" />
          <option value="Packing Tape" />
          <option value="New Item" />
        </datalist>
      </div>

      <div>
        <label className="sm:hidden text-[10px] font-medium text-gray-500 uppercase">
          Qty
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={item.qty === 0 ? '' : item.qty}
          onChange={e => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            dispatch({
              type: 'UPDATE_LINE_ITEM',
              payload: { id: item.id, field: 'qty', value: val },
            });
          }}
          className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm text-gray-700 font-mono text-center focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
        />
      </div>

      <div>
        <label className="sm:hidden text-[10px] font-medium text-gray-500 uppercase">
          Unit
        </label>
        <select
          value={item.unit}
          onChange={e =>
            dispatch({
              type: 'UPDATE_LINE_ITEM',
              payload: { id: item.id, field: 'unit', value: e.target.value },
            })
          }
          className="w-full h-9 px-2 border border-gray-200 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
        >
          {UNITS.map(u => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sm:hidden text-[10px] font-medium text-gray-500 uppercase">
          Rate
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.rate === 0 ? '' : item.rate}
          onChange={e => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            dispatch({
              type: 'UPDATE_LINE_ITEM',
              payload: { id: item.id, field: 'rate', value: val },
            });
          }}
          className="w-full h-9 px-2.5 border border-gray-200 rounded-md text-sm text-gray-700 font-mono text-right focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{ ['--tw-ring-color' as string]: general.primaryColor + '40' }}
        />
      </div>

      <div>
        <label className="sm:hidden text-[10px] font-medium text-gray-500 uppercase">
          Amount
        </label>
        <div className="h-9 px-2.5 flex items-center justify-end bg-gray-50 border border-gray-100 rounded-md text-sm font-mono text-gray-700">
          {item.amount.toFixed(2)}
        </div>
      </div>

      <div className="flex items-end sm:items-center justify-end">
        <button
          onClick={handleRemove}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
