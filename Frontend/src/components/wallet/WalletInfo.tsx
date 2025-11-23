import { useWallet } from '../../hooks/useWallet';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WalletInfo() {
  const { address, walletName, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  if (!address) return null;

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 hover:border-[#97F0E5] transition-colors"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-white font-mono text-sm">{shortAddress}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-4 border-b border-[#334155]">
              <div className="text-gray-400 text-xs mb-1">Connected with</div>
              <div className="text-white font-semibold">{walletName}</div>
              <div className="text-gray-400 text-xs mt-2 font-mono break-all">
                {address}
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(address);
                setShowDropdown(false);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-[#0f172a] transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Address
            </button>

            <button
              onClick={() => {
                setShowDropdown(false);
                // Disconnect first (synchronous call)
                disconnect();
                // Force redirect to Sirius landing page (connect wallet page)
                // Use window.location to ensure navigation happens immediately
                setTimeout(() => {
                  window.location.href = '/sirius';
                }, 100);
              }}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-[#0f172a] transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

