/**
 * Wallet types for Sirius
 */

export interface WalletConnection {
  address: string;
  publicKey: string;
  walletName: string;
}

export interface WalletSignatureRequest {
  message: string;
  description?: string;
}

export interface WalletSignatureResult {
  signature: string;
  publicKey: string;
}

export type WalletType = 'sui-wallet' | 'suiet' | 'ethos' | 'martian';

export interface WalletInfo {
  name: string;
  type: WalletType;
  icon: string;
  installed: boolean;
}

