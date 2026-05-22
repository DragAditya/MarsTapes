import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/store/AppContext';
import { Receipt } from 'lucide-react';

export function PinLock() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const tryUnlock = useCallback((attempt: string) => {
    if (attempt === settings.security.pin) {
      dispatch({ type: 'SET_PIN_LOCKED', payload: false });
      setPin('');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPin('');
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Incorrect PIN', type: 'error' } });
    }
  }, [settings.security.pin, dispatch]);

  // BUG FIX: inline the unlock logic in the keydown handler — no stale-closure risk.
  // Previously handleSubmit was defined outside useEffect so the closure could be stale.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Read the pin from the latest state via a callback ref approach
        setPin(current => {
          if (current === settings.security.pin) {
            dispatch({ type: 'SET_PIN_LOCKED', payload: false });
            return '';
          } else {
            setShake(true);
            setTimeout(() => setShake(false), 400);
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Incorrect PIN', type: 'error' } });
            return '';
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.security.pin, dispatch]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    // Auto-submit when PIN reaches the expected length
    if (settings.security.pin && newPin.length >= settings.security.pin.length) {
      // Small delay so user sees the last dot fill in
      setTimeout(() => tryUnlock(newPin), 80);
    }
  };

  const handleDel = () => {
    setPin(p => p.slice(0, -1));
  };

  const maxLen = settings.security.pin ? settings.security.pin.length : 6;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: settings.general.primaryColor + '15' }}>
        <Receipt className="w-8 h-8" style={{ color: settings.general.primaryColor }} />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">Mars Enterprise</h2>
      <p className="text-sm text-gray-500 mb-8">Enter PIN to unlock</p>

      <div className={`flex items-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
        {Array.from({ length: maxLen }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 transition-all ${
              i < pin.length ? 'border-current' : 'border-gray-300'
            }`}
            style={i < pin.length ? { backgroundColor: settings.general.primaryColor, borderColor: settings.general.primaryColor } : {}}
          />
        ))}
      </div>

      {/* Hidden input for mobile keyboard */}
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus
        value={pin}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
          setPin(val);
          if (settings.security.pin && val.length >= settings.security.pin.length) {
            setTimeout(() => tryUnlock(val), 80);
          }
        }}
        className="absolute opacity-0 w-0 h-0"
      />

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[240px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'del') handleDel();
              else if (key) handleDigit(key);
            }}
            className={`w-16 h-16 rounded-xl text-lg font-medium transition-colors ${
              key === '' ? 'pointer-events-none' :
              key === 'del' ? 'text-gray-500 hover:bg-gray-100 active:bg-gray-200' :
              'text-gray-800 hover:bg-gray-100 active:bg-gray-200'
            }`}
            disabled={key === ''}
          >
            {key === 'del' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
            ) : key}
          </button>
        ))}
      </div>

      <button
        onClick={() => tryUnlock(pin)}
        className="mt-6 px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
        style={{ backgroundColor: settings.general.primaryColor }}
      >
        Unlock
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
