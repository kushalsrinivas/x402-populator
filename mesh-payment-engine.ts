import { AgentSDK, createPaymentPayload } from 'agent-sdk';
import { Contract, Wallet } from 'ethers';
import { Config, PaymentResult, WalletState, TokenConfig } from './types';
import { Logger } from './logger';
import {
  randomSelect,
  randomBetween,
  randomSleep,
  toTokenWei,
  fromTokenWei,
  formatAddress,
  retryWithBackoff,
  formatTokenAmount,
} from './utils';

export class MeshPaymentEngine {
  private config: Config;
  private logger: Logger;
  private sdk: AgentSDK;
  private wallets: WalletState[] = [];
  private running: boolean = false;
  private stats = {
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
    startTime: 0,
  };

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // Initialize SDK with network config
    this.sdk = new AgentSDK({
      defaultNetwork: config.network.name,
      networks: {
        [config.network.name]: {
          name: config.network.name,
          chainId: config.network.chainId,
          rpcUrl: config.network.rpcUrl,
          erc8004: config.network.erc8004,
          x402: config.network.x402,
        },
      },
    });
  }

  /**
   * Initialize all wallets and check balances
   */
  async initialize(): Promise<void> {
    this.logger.section('Initializing Mesh Payment Engine');

    // Initialize wallets
    const enabledWallets = this.config.wallets.filter(w => w.enabled);
    this.logger.info(`Found ${enabledWallets.length} enabled wallet(s)`);

    for (const walletConfig of enabledWallets) {
      try {
        const privateKey = walletConfig.privateKey.startsWith('0x')
          ? walletConfig.privateKey
          : `0x${walletConfig.privateKey}`;

        const wallet = new Wallet(privateKey);
        const address = await wallet.getAddress();

        const walletState: WalletState = {
          address,
          name: walletConfig.name,
          privateKey,
          balances: new Map(),
          nonces: new Map(),
          lastPaymentTime: 0,
        };

        this.wallets.push(walletState);
        this.logger.info(`Initialized ${walletConfig.name}: ${formatAddress(address)}`);

        // Check balances for all tokens
        await this.checkWalletBalances(walletState);
      } catch (error: any) {
        this.logger.error(`Failed to initialize ${walletConfig.name}`, error);
      }
    }

    if (this.wallets.length === 0) {
      throw new Error('No wallets successfully initialized');
    }

    // Approve tokens if configured
    if (this.config.paymentSettings.approveTokensOnStartup) {
      await this.approveAllTokens();
    }

    this.logger.success(`Engine initialized with ${this.wallets.length} wallet(s)`);
  }

  /**
   * Check token balances for a wallet
   */
  private async checkWalletBalances(walletState: WalletState): Promise<void> {
    const provider = this.sdk.getProvider(this.config.network.name);
    const enabledTokens = this.config.tokens.filter(t => t.enabled);

    for (const token of enabledTokens) {
      try {
        const tokenABI = [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
        ];

        const wallet = new Wallet(walletState.privateKey);
        const tokenContract = new Contract(token.address, tokenABI, wallet.connect(provider));
        const balance = await tokenContract.balanceOf(walletState.address);

        walletState.balances.set(token.address, balance);

        const balanceFormatted = fromTokenWei(balance, token.decimals);
        this.logger.info(
          `  ${token.symbol} balance: ${balanceFormatted} (${formatAddress(walletState.address)})`
        );

        // Warn if balance is low
        if (Number(balanceFormatted) < this.config.paymentSettings.minAmountUSD * 10) {
          this.logger.warn(
            `  Low ${token.symbol} balance in ${walletState.name} - only ${balanceFormatted} available`
          );
        }
      } catch (error: any) {
        this.logger.error(`Failed to check ${token.symbol} balance for ${walletState.name}`, error);
      }
    }
  }

  /**
   * Approve all tokens for all wallets
   */
  private async approveAllTokens(): Promise<void> {
    this.logger.section('Approving Tokens');

    const relayerAddress = this.config.network.x402.verifyingContract;
    const provider = this.sdk.getProvider(this.config.network.name);
    const enabledTokens = this.config.tokens.filter(t => t.enabled);

    for (const walletState of this.wallets) {
      for (const token of enabledTokens) {
        try {
          const tokenABI = [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)',
          ];

          const wallet = new Wallet(walletState.privateKey);
          const tokenContract = new Contract(token.address, tokenABI, wallet.connect(provider));

          const currentAllowance = await tokenContract.allowance(
            walletState.address,
            relayerAddress
          );

          // Check if approval needed (allow if less than max payment * 100)
          const minAllowance = BigInt(
            toTokenWei(this.config.paymentSettings.maxAmountUSD * 100, token.decimals)
          );

          if (currentAllowance < minAllowance) {
            this.logger.info(
              `Approving ${token.symbol} for ${walletState.name} (${formatAddress(walletState.address)})...`
            );

            const approveTx = await tokenContract.approve(
              relayerAddress,
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            );

            this.logger.info(`  Approval TX: ${approveTx.hash}`);
            const receipt = await approveTx.wait();

            if (receipt && receipt.status === 1) {
              this.logger.success(
                `  ${token.symbol} approved for ${walletState.name} (Block: ${receipt.blockNumber})`
              );
            } else {
              this.logger.error(`  Approval failed for ${token.symbol} in ${walletState.name}`);
            }
          } else {
            this.logger.info(
              `  ${token.symbol} already approved for ${walletState.name} (${formatAddress(walletState.address)})`
            );
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to approve ${token.symbol} for ${walletState.name}`,
            error
          );
        }
      }
    }
  }

  /**
   * Execute a single payment
   */
  private async executePayment(
    walletState: WalletState,
    token: TokenConfig,
    recipient: string,
    amountUSD: number
  ): Promise<PaymentResult> {
    const amountWei = toTokenWei(amountUSD, token.decimals);
    const result: PaymentResult = {
      success: false,
      fromWallet: walletState.address,
      toAddress: recipient,
      tokenSymbol: token.symbol,
      amount: amountUSD.toFixed(token.decimals),
      timestamp: new Date(),
    };

    try {
      // Check balance
      const balance = walletState.balances.get(token.address) || BigInt(0);
      if (balance < BigInt(amountWei)) {
        throw new Error(
          `Insufficient balance: need ${fromTokenWei(amountWei, token.decimals)} ${token.symbol}, have ${fromTokenWei(balance, token.decimals)} ${token.symbol}`
        );
      }

      this.logger.payment({
        from: formatAddress(walletState.address),
        to: formatAddress(recipient),
        token: token.symbol,
        amount: result.amount,
        status: 'pending',
      });

      // Create payment requirements
      const requirements = {
        scheme: 'exact' as const,
        network: this.config.network.name as any,
        asset: token.address,
        payTo: recipient,
        maxAmountRequired: amountWei,
        maxTimeoutSeconds: 3600,
        description: `Mesh payment: ${amountUSD} ${token.symbol}`,
        relayerContract: this.config.network.x402.verifyingContract,
      };

      // Create wallet and payload
      const wallet = new Wallet(walletState.privateKey);
      const network = this.sdk.getNetwork(this.config.network.name);
      const payload = await createPaymentPayload(requirements, wallet, network);

      // Verify payment
      const facilitator = this.sdk.getFacilitator(this.config.network.name);
      const verifyResult = await facilitator.verify(payload, requirements);

      if (!verifyResult.isValid) {
        throw new Error(`Verification failed: ${verifyResult.invalidReason || 'Unknown reason'}`);
      }

      // Settle payment
      const settleResult = await facilitator.settle(payload, requirements);

      if (settleResult.success && settleResult.transaction) {
        result.success = true;
        result.transactionHash = settleResult.transaction;

        // Update wallet state
        walletState.balances.set(
          token.address,
          balance - BigInt(amountWei)
        );
        walletState.lastPaymentTime = Date.now();

        this.logger.payment({
          from: formatAddress(walletState.address),
          to: formatAddress(recipient),
          token: token.symbol,
          amount: result.amount,
          txHash: settleResult.transaction,
          status: 'success',
        });
      } else {
        throw new Error(`Settlement failed: ${settleResult.errorReason || 'Unknown error'}`);
      }
    } catch (error: any) {
      result.success = false;
      result.error = error.message;

      this.logger.payment({
        from: formatAddress(walletState.address),
        to: formatAddress(recipient),
        token: token.symbol,
        amount: result.amount,
        status: 'failed',
      });
      this.logger.error(`Payment error: ${error.message}`);
    }

    return result;
  }

  /**
   * Run a single payment iteration
   */
  private async runPaymentIteration(): Promise<void> {
    try {
      // Select random wallet
      const wallet = randomSelect(this.wallets);

      // Select random token
      const enabledTokens = this.config.tokens.filter(t => t.enabled);
      const token = randomSelect(enabledTokens);

      // Select random recipient
      const recipient = randomSelect(this.config.recipients);

      // Generate random amount
      const amount = randomBetween(
        this.config.paymentSettings.minAmountUSD,
        this.config.paymentSettings.maxAmountUSD
      );

      this.logger.info(
        `Selected: ${wallet.name} → ${formatAddress(recipient)} | ${formatTokenAmount(amount, token)}`
      );

      // Execute payment with retries
      const result = await retryWithBackoff(
        () => this.executePayment(wallet, token, recipient, amount),
        this.config.paymentSettings.maxRetries,
        this.config.paymentSettings.retryDelaySeconds,
        'Payment'
      );

      // Update stats
      this.stats.totalPayments++;
      if (result.success) {
        this.stats.successfulPayments++;
        this.stats.totalAmount += amount;
      } else {
        this.stats.failedPayments++;
      }
    } catch (error: any) {
      this.logger.error('Payment iteration failed', error);
      this.stats.totalPayments++;
      this.stats.failedPayments++;
    }
  }

  /**
   * Print statistics
   */
  private printStats(): void {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const successRate = this.stats.totalPayments > 0
      ? ((this.stats.successfulPayments / this.stats.totalPayments) * 100).toFixed(2)
      : '0.00';

    this.logger.separator();
    this.logger.info(`📊 Statistics:`);
    this.logger.info(`   Total Payments: ${this.stats.totalPayments}`);
    this.logger.info(`   Successful: ${this.stats.successfulPayments} (${successRate}%)`);
    this.logger.info(`   Failed: ${this.stats.failedPayments}`);
    this.logger.info(`   Total Amount: $${this.stats.totalAmount.toFixed(2)}`);
    this.logger.info(`   Runtime: ${Math.floor(runtime)}s`);
    this.logger.separator();
  }

  /**
   * Start the mesh payment engine
   */
  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('Engine is already running');
      return;
    }

    this.running = true;
    this.stats.startTime = Date.now();

    this.logger.section('Starting Mesh Payment Engine');
    this.logger.info('Press Ctrl+C to stop');

    while (this.running) {
      try {
        await this.runPaymentIteration();

        // Random delay before next payment
        const delay = randomBetween(
          this.config.paymentSettings.minDelaySeconds,
          this.config.paymentSettings.maxDelaySeconds
        );

        this.logger.info(`⏳ Waiting ${delay.toFixed(1)}s before next payment...\n`);
        await randomSleep(
          this.config.paymentSettings.minDelaySeconds,
          this.config.paymentSettings.maxDelaySeconds
        );

        // Print stats every 10 payments
        if (this.stats.totalPayments % 10 === 0) {
          this.printStats();
        }
      } catch (error: any) {
        this.logger.error('Iteration error', error);
        await randomSleep(
          this.config.paymentSettings.retryDelaySeconds,
          this.config.paymentSettings.retryDelaySeconds * 2
        );
      }
    }
  }

  /**
   * Stop the mesh payment engine
   */
  stop(): void {
    if (!this.running) {
      this.logger.warn('Engine is not running');
      return;
    }

    this.logger.section('Stopping Mesh Payment Engine');
    this.running = false;
    this.printStats();
    this.logger.success('Engine stopped');
  }

  /**
   * Get current statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

