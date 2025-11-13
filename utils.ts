import { TokenConfig } from './types';

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Select a random item from an array
 */
export function randomSelect<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Convert amount to token's smallest unit (wei)
 */
export function toTokenWei(amount: number, decimals: number): string {
  const multiplier = 10 ** decimals;
  return Math.floor(amount * multiplier).toString();
}

/**
 * Convert token's smallest unit to human-readable amount
 */
export function fromTokenWei(amount: string | bigint, decimals: number): string {
  const divisor = 10 ** decimals;
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  return (Number(value) / divisor).toFixed(decimals);
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep for a random duration between min and max seconds
 */
export async function randomSleep(minSeconds: number, maxSeconds: number): Promise<void> {
  const seconds = randomBetween(minSeconds, maxSeconds);
  await sleep(seconds * 1000);
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate private key
 */
export function isValidPrivateKey(key: string): boolean {
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  return /^[a-fA-F0-9]{64}$/.test(cleanKey);
}

/**
 * Generate a unique nonce for payment
 */
export function generateNonce(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delaySeconds: number,
  description: string = 'Operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw new Error(`${description} failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      const delay = delaySeconds * Math.pow(2, attempt - 1);
      console.log(`Retry ${attempt}/${maxRetries} for ${description} in ${delay}s...`);
      await sleep(delay * 1000);
    }
  }
  
  throw new Error(`${description} failed after ${maxRetries} attempts`);
}

/**
 * Format token amount with symbol
 */
export function formatTokenAmount(amount: string | number, token: TokenConfig): string {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${amountNum.toFixed(token.decimals)} ${token.symbol}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0.00';
  return ((value / total) * 100).toFixed(2);
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check wallets
  if (!config.wallets || config.wallets.length === 0) {
    errors.push('No wallets configured');
  } else {
    config.wallets.forEach((wallet: any, index: number) => {
      if (!wallet.privateKey) {
        errors.push(`Wallet ${index + 1} missing private key`);
      } else if (!isValidPrivateKey(wallet.privateKey)) {
        errors.push(`Wallet ${index + 1} has invalid private key format`);
      }
    });
  }

  // Check tokens
  if (!config.tokens || config.tokens.length === 0) {
    errors.push('No tokens configured');
  } else {
    config.tokens.forEach((token: any, index: number) => {
      if (!token.address || !isValidAddress(token.address)) {
        errors.push(`Token ${index + 1} has invalid address`);
      }
      if (typeof token.decimals !== 'number' || token.decimals < 0 || token.decimals > 18) {
        errors.push(`Token ${index + 1} has invalid decimals`);
      }
    });
  }

  // Check recipients
  if (!config.recipients || config.recipients.length === 0) {
    errors.push('No recipient addresses configured');
  } else {
    config.recipients.forEach((address: string, index: number) => {
      if (!isValidAddress(address)) {
        errors.push(`Recipient ${index + 1} has invalid address: ${address}`);
      }
    });
  }

  // Check payment settings
  if (!config.paymentSettings) {
    errors.push('Payment settings not configured');
  } else {
    const settings = config.paymentSettings;
    if (settings.minAmountUSD <= 0) {
      errors.push('minAmountUSD must be greater than 0');
    }
    if (settings.maxAmountUSD <= settings.minAmountUSD) {
      errors.push('maxAmountUSD must be greater than minAmountUSD');
    }
    if (settings.minDelaySeconds < 0) {
      errors.push('minDelaySeconds cannot be negative');
    }
    if (settings.maxDelaySeconds <= settings.minDelaySeconds) {
      errors.push('maxDelaySeconds must be greater than minDelaySeconds');
    }
  }

  return { valid: errors.length === 0, errors };
}

