import { useWallet } from '../../hooks/useWallet';
import { useUIStore } from '../../stores/useUIStore';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export default function ConnectWalletModal() {
  const { isConnectWalletModalOpen, closeConnectWalletModal } = useUIStore();
  const { connect, isConnecting, allWallets, isDemoMode } = useWallet();
  const navigate = useNavigate();

  if (!isConnectWalletModalOpen) return null;

  // Wallets to display (all connect via Sui backend for Walrus compatibility)
  const walletOptions = [
    {
      name: 'Slush',
      logo: '/logo_slush.png',
      emoji: '💧',
      description: 'Fast & Secure • Recommended for Walrus',
      color: 'from-blue-400 to-cyan-400',
    },
    {
      name: 'Phantom',
      logo: '/logo_phantom.png',
      emoji: '👻',
      description: 'Multi-chain • Popular choice',
      color: 'from-purple-400 to-pink-400',
    },
    {
      name: 'MetaMask',
      logo: '/logo_metamask.png',
      emoji: '🦊',
      description: 'Most trusted • Industry standard',
      color: 'from-orange-400 to-yellow-400',
    },
  ];

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      // Small delay to let connection complete
      setTimeout(() => {
        closeConnectWalletModal();
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeConnectWalletModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl max-w-md w-full p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
            <button
              onClick={closeConnectWalletModal}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-gray-400 mb-6">
            Choose how you want to connect to Sirius
          </p>

          {/* Info Notice */}
          <div className="bg-[#97F0E5]/10 border border-[#97F0E5]/20 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-[#97F0E5] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-[#97F0E5] text-sm font-semibold mb-1">
                  Powered by Sui Blockchain
                </div>
                <div className="text-[#97F0E5]/80 text-xs">
                  All wallets connect through Sui for Walrus compatibility. Slush is recommended.
                </div>
              </div>
            </div>
          </div>

          {/* Wallet options */}
          <div className="space-y-3">
            {walletOptions.map((wallet, index) => (
              <button
                key={wallet.name}
                onClick={() => handleConnect(wallet.name)}
                disabled={isConnecting}
                className={`w-full bg-[#0f172a] border rounded-lg p-4 hover:border-[#97F0E5] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative ${
                  index === 0 ? 'border-[#97F0E5]' : 'border-[#334155]'
                }`}
              >
                {/* Recommended badge for Slush */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 bg-[#97F0E5] text-[#161923] text-xs font-bold px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Wallet logo or emoji fallback */}
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center p-2">
                      <img 
                        src={wallet.logo} 
                        alt={wallet.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to emoji with gradient if image fails
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.className = `w-14 h-14 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center shadow-lg`;
                            const emoji = document.createElement('span');
                            emoji.textContent = wallet.emoji;
                            emoji.className = 'text-3xl filter drop-shadow-md';
                            parent.appendChild(emoji);
                          }
                        }}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-white font-semibold text-lg">
                        {wallet.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {wallet.description}
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-[#97F0E5] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#334155]" />
            <span className="text-gray-500 text-sm">Coming soon</span>
            <div className="flex-1 h-px bg-[#334155]" />
          </div>

          {/* zkLogin option (Coming soon) */}
          <button
            disabled
            className="w-full bg-gray-700 text-gray-500 font-semibold rounded-lg p-4 transition-all flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google (zkLogin) - Coming Soon
          </button>
        </div>
      </div>
    </>
  );
}

