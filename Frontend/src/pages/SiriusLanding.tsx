import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import ConnectWalletButton from '../components/wallet/ConnectWalletButton';
import ConnectWalletModal from '../components/wallet/ConnectWalletModal';
import siriusImage2 from '../assets/svg/sirius-image-2.svg';
import logoSirius from '../assets/svg/logo-sirius.svg';

/**
 * Landing page for Sirius Data Layer
 * Shows when user clicks "Use Sir" button from original home
 * Prompts wallet connection and explains the system
 */
export default function SiriusLanding() {
  const { isConnected, address } = useWallet();
  const navigate = useNavigate();
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  // If already connected, redirect to dashboard (but only after initial check to avoid redirect loop)
  useEffect(() => {
    if (!hasCheckedConnection) {
      setHasCheckedConnection(true);
      // Small delay to avoid redirect loop after disconnect
      const timer = setTimeout(() => {
        // Only redirect if truly connected (both isConnected and address exist)
        if (isConnected && address) {
          navigate('/dashboard');
        }
      }, 1000); // Increased delay to ensure disconnect state is updated
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, navigate, hasCheckedConnection]);

  return (
    <div className="min-h-screen bg-[#161923] text-white relative overflow-hidden">
      {/* Background image with opacity */}
      <img
        src={siriusImage2}
        alt="Sirius Background"
        className="fixed inset-0 w-full h-full object-cover opacity-10 z-0"
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              <img 
                src={logoSirius} 
                alt="Sirius Logo" 
                className="h-16 w-16 group-hover:scale-110 transition-transform"
                style={{
                  filter: 'brightness(2.5) contrast(2) saturate(2) drop-shadow(0 0 15px rgba(151, 240, 229, 1)) drop-shadow(0 0 30px rgba(151, 240, 229, 0.7)) drop-shadow(0 0 45px rgba(151, 240, 229, 0.4))',
                  WebkitFilter: 'brightness(2.5) contrast(2) saturate(2) drop-shadow(0 0 15px rgba(151, 240, 229, 1)) drop-shadow(0 0 30px rgba(151, 240, 229, 0.7)) drop-shadow(0 0 45px rgba(151, 240, 229, 0.4))',
                }}
              />
              {/* Overlay pour épaisseur et couleur */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(151, 240, 229, 0.4) 0%, transparent 70%)',
                  mixBlendMode: 'screen',
                }}
              />
            </div>
            <span className="text-4xl font-bold text-white drop-shadow-md" style={{ fontFamily: 'TheAliens, sans-serif' }}>Sirius</span>
          </button>
          <div className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Docs
            </a>
            <a
              href="/about"
              className="text-gray-400 hover:text-white transition-colors"
            >
              About
            </a>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-8 pt-20 pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#97F0E5]/10 border border-[#97F0E5]/20 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-[#97F0E5] rounded-full animate-pulse" />
            <span className="text-[#97F0E5] text-sm font-medium">
              Powered by Walrus & Sui
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Trust & Traceability for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#97F0E5] to-[#60D5E8]">
              Distributed Storage
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Cryptographic integrity, verifiable history, and blockchain anchoring
            for your datasets stored on Walrus.
          </p>

          {/* CTA Button */}
          <ConnectWalletButton size="large" className="mb-4" />

          <p className="text-gray-500 text-sm">
            Connect your Sui wallet to get started • No installation required
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-[#334155] rounded-xl p-8 hover:border-[#97F0E5] transition-colors">
              <div className="w-12 h-12 bg-[#97F0E5]/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#97F0E5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Cryptographic Integrity</h3>
              <p className="text-gray-400">
                Merkle trees create unique fingerprints of your datasets.
                Detect any modification instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-[#334155] rounded-xl p-8 hover:border-[#97F0E5] transition-colors">
              <div className="w-12 h-12 bg-[#97F0E5]/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#97F0E5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Digital Signatures</h3>
              <p className="text-gray-400">
                Every version is cryptographically signed with your Sui wallet.
                Prove authorship mathematically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-[#334155] rounded-xl p-8 hover:border-[#97F0E5] transition-colors">
              <div className="w-12 h-12 bg-[#97F0E5]/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#97F0E5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Version History</h3>
              <p className="text-gray-400">
                Complete audit trail with parent-child version links.
                Track every change over time.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto px-8 pb-20">
          <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-[#334155] rounded-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-[#97F0E5] mb-2">{'99.9%'}</div>
                <div className="text-gray-400 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#97F0E5] mb-2">~$0.002</div>
                <div className="text-gray-400 text-sm">Per Version</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#97F0E5] mb-2">{'< 5s'}</div>
                <div className="text-gray-400 text-sm">Verification Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#97F0E5] mb-2">{'100%'}</div>
                <div className="text-gray-400 text-sm">Verifiable</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Wallet Modal */}
      <ConnectWalletModal />
    </div>
  );
}

