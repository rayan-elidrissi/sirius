import { useWallet } from '../../hooks/useWallet';
import { useUIStore } from '../../stores/useUIStore';
import { useNavigate } from 'react-router-dom';

interface ConnectWalletButtonProps {
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  className?: string;
}

export default function ConnectWalletButton({
  size = 'medium',
  fullWidth = false,
  className = '',
}: ConnectWalletButtonProps) {
  const { isConnected, isConnecting, address } = useWallet();
  const { openConnectWalletModal } = useUIStore();
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  // If connected, show "Go to Dashboard" button instead
  if (isConnected && address) {
    return (
      <button
        onClick={() => navigate('/dashboard')}
        className={`
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          bg-[#97F0E5] 
          text-[#161923] 
          font-semibold 
          rounded-lg 
          hover:brightness-110 
          transition-all 
          duration-200
          ${className}
        `}
      >
        <span className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go to Dashboard
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={openConnectWalletModal}
      disabled={isConnecting}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        bg-[#97F0E5] 
        text-[#161923] 
        font-semibold 
        rounded-lg 
        hover:brightness-110 
        transition-all 
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isConnecting ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Connecting...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
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
          Connect Wallet
        </span>
      )}
    </button>
  );
}

