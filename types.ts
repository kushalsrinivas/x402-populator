export interface WalletConfig {
  name: string;
  privateKey: string;
  enabled: boolean;
}

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
  enabled: boolean;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  erc8004: {
    identityRegistry: string;
    reputationRegistry: string;
    validationRegistry: string;
  };
  x402: {
    facilitatorUrl: string;
    domainName: string;
    domainVersion: string;
    verifyingContract: string;
  };
}

export interface PaymentSettings {
  minAmountUSD: number;
  maxAmountUSD: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  maxRetries: number;
  retryDelaySeconds: number;
  approveTokensOnStartup: boolean;
}

export interface LoggingConfig {
  enabled: boolean;
  logFile: string;
  verbose: boolean;
}

export interface Config {
  network: NetworkConfig;
  wallets: WalletConfig[];
  tokens: TokenConfig[];
  recipients: string[];
  paymentSettings: PaymentSettings;
  logging: LoggingConfig;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  fromWallet: string;
  toAddress: string;
  tokenSymbol: string;
  amount: string;
  timestamp: Date;
}

export interface WalletState {
  address: string;
  name: string;
  privateKey: string;
  balances: Map<string, bigint>; // token address -> balance
  nonces: Map<string, Set<string>>; // token address -> used nonces
  lastPaymentTime: number;
}

