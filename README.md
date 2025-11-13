# Mesh Payment System - Automated X402 Payments

An automated mesh payment system that uses the X402 gasless payment protocol to distribute tokens across multiple wallets. The system randomly selects wallets, tokens, amounts, and recipients to create a natural payment distribution pattern.

## 🌟 Features

- ✅ **Multiple Wallets** - Support for multiple sender wallets
- ✅ **Multiple Tokens** - Configure multiple ERC-20 tokens
- ✅ **Random Distribution** - Random selection of wallet, token, amount, and recipient
- ✅ **X402 Gasless Payments** - No gas fees for senders (facilitator pays)
- ✅ **Automatic Token Approval** - One-time token approval on startup
- ✅ **Retry Logic** - Automatic retries with exponential backoff
- ✅ **Comprehensive Logging** - Console and file logging with statistics
- ✅ **Graceful Shutdown** - Clean exit with Ctrl+C
- ✅ **Balance Monitoring** - Tracks balances and warns on low funds
- ✅ **Production Ready** - Built for continuous server operation

## 📋 Prerequisites

- Node.js 18+ and npm
- Private keys for sender wallets
- Tokens in sender wallets (e.g., USDT on Avalanche Fuji)
- Recipient addresses

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mesh-payments
npm install
```

### 2. Configure the System

Create your configuration file from the example:

```bash
cp config.example.json config.json
```

Edit `config.json` with your settings:

```json
{
  "wallets": [
    {
      "name": "Wallet 1",
      "privateKey": "YOUR_PRIVATE_KEY_HERE",
      "enabled": true
    }
  ],
  "tokens": [
    {
      "symbol": "USDT",
      "address": "0x40dAE5db31DD56F1103Dd9153bd806E00A2f07BA",
      "decimals": 6,
      "enabled": true
    }
  ],
  "recipients": [
    "0xRecipient1Address...",
    "0xRecipient2Address..."
  ],
  "paymentSettings": {
    "minAmountUSD": 0.1,
    "maxAmountUSD": 10.0,
    "minDelaySeconds": 30,
    "maxDelaySeconds": 300
  }
}
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run the System

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## 📖 Configuration Guide

### Network Configuration

The `network` section defines the blockchain network and contracts:

```json
{
  "network": {
    "name": "fuji",
    "chainId": 43113,
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "x402": {
      "facilitatorUrl": "http://testnet.0xgasless.com",
      "verifyingContract": "0x8BD697733c31293Be2327026d01aE393Ab2675C4"
    }
  }
}
```

**For Mainnet:**
- Update `chainId` to 43114
- Update `rpcUrl` to mainnet RPC
- Update contract addresses to mainnet contracts

### Wallet Configuration

Add multiple wallets for distributed payments:

```json
{
  "wallets": [
    {
      "name": "Wallet 1",           // Friendly name for logging
      "privateKey": "0x...",         // Private key (with or without 0x prefix)
      "enabled": true                // Set to false to temporarily disable
    },
    {
      "name": "Wallet 2",
      "privateKey": "0x...",
      "enabled": true
    }
  ]
}
```

**Security Notes:**
- ⚠️ Never commit `config.json` with real private keys
- ⚠️ Use environment variables or secure key management in production
- ⚠️ Ensure wallets have sufficient token balances

### Token Configuration

Configure which tokens to use for payments:

```json
{
  "tokens": [
    {
      "symbol": "USDT",             // Token symbol for display
      "address": "0x...",            // ERC-20 token contract address
      "decimals": 6,                 // Token decimals (USDT = 6, most = 18)
      "enabled": true                // Set to false to disable
    },
    {
      "symbol": "USDC",
      "address": "0x...",
      "decimals": 6,
      "enabled": true
    }
  ]
}
```

**Common Token Decimals:**
- USDT, USDC: 6 decimals
- ETH, AVAX, most ERC-20s: 18 decimals

### Recipients

List of addresses that will receive payments:

```json
{
  "recipients": [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333"
  ]
}
```

**Notes:**
- Each payment randomly selects one recipient
- Can be any valid Ethereum address
- More recipients = more distribution variety

### Payment Settings

Control payment behavior:

```json
{
  "paymentSettings": {
    "minAmountUSD": 0.1,           // Minimum payment amount
    "maxAmountUSD": 10.0,          // Maximum payment amount
    "minDelaySeconds": 30,         // Minimum wait between payments
    "maxDelaySeconds": 300,        // Maximum wait between payments (5 min)
    "maxRetries": 3,               // Number of retries on failure
    "retryDelaySeconds": 60,       // Delay before retry
    "approveTokensOnStartup": true // Auto-approve tokens on start
  }
}
```

**Recommendations:**
- **Production:** Higher delays (120-600s) to avoid rate limiting
- **Testing:** Lower delays (10-30s) for faster testing
- **Amount Range:** Set based on your use case and budget

### Logging Configuration

```json
{
  "logging": {
    "enabled": true,               // Enable/disable file logging
    "logFile": "mesh-payments.log", // Log file name (in logs/ directory)
    "verbose": true                // Show detailed logs in console
  }
}
```

## 🔄 How It Works

### Payment Flow

1. **Initialization**
   - Load configuration and validate settings
   - Initialize all enabled wallets
   - Check token balances for each wallet
   - Approve tokens for X402 relayer (if enabled)

2. **Payment Loop** (continuous)
   - Randomly select a wallet from enabled wallets
   - Randomly select a token from enabled tokens
   - Randomly select a recipient from the list
   - Generate random amount between min and max
   - Execute X402 payment:
     - Create signed payment payload
     - Verify with facilitator
     - Settle on-chain (facilitator pays gas)
   - Wait random delay before next payment
   - Log results and update statistics

3. **X402 Payment Process**
   ```
   Wallet → Create Signature → Facilitator Verifies → On-chain Settlement
     |            |                    |                      |
     |            |                    |                      |
   (Free)      (Free)              (Free)              (Facilitator pays gas)
   ```

### Randomization

- **Wallet Selection:** Equal probability for all enabled wallets
- **Token Selection:** Equal probability for all enabled tokens
- **Recipient Selection:** Equal probability for all recipients
- **Amount:** Uniform distribution between min and max
- **Delay:** Uniform distribution between min and max delay

### Error Handling

- **Insufficient Balance:** Skips payment, logs warning
- **Network Errors:** Retries with exponential backoff
- **Verification Failures:** Logs error, continues to next payment
- **Settlement Failures:** Retries up to `maxRetries` times

## 📊 Monitoring

### Console Output

The system provides real-time console output:

```
✅ Initialized Wallet 1: 0x1234...5678
ℹ️  USDT balance: 100.000000 (0x1234...5678)
ℹ️  Selected: Wallet 1 → 0x9999...9999 | 5.23 USDT
✅ Payment SUCCESS: 0x1234...5678 → 0x9999...9999 | 5.230000 USDT | TX: 0xabcd...
⏳ Waiting 45.3s before next payment...
```

### Statistics

Every 10 payments, the system shows statistics:

```
--------------------------------------------------------------------------------
📊 Statistics:
   Total Payments: 50
   Successful: 48 (96.00%)
   Failed: 2
   Total Amount: $234.56
   Runtime: 3456s
--------------------------------------------------------------------------------
```

### Log Files

All activity is logged to `logs/mesh-payments.log`:

```
[2024-01-15T10:30:45.123Z] [INFO] Engine initialized with 3 wallet(s)
[2024-01-15T10:30:50.456Z] [SUCCESS] Payment SUCCESS: 0x1234...5678 → 0x9999...9999 | 5.230000 USDT | TX: 0xabcd...
[2024-01-15T10:31:35.789Z] [ERROR] Payment failed: Insufficient balance
```

## 🛠️ Maintenance

### Adding New Wallets

1. Generate new wallet or export private key
2. Fund wallet with tokens
3. Add to `config.json`:
   ```json
   {
     "name": "New Wallet",
     "privateKey": "0x...",
     "enabled": true
   }
   ```
4. Restart the system (tokens will auto-approve)

### Adding New Tokens

1. Get token contract address
2. Verify token decimals (check contract or blockchain explorer)
3. Add to `config.json`:
   ```json
   {
     "symbol": "NEWTOKEN",
     "address": "0x...",
     "decimals": 18,
     "enabled": true
   }
   ```
4. Fund wallets with new token
5. Restart the system

### Checking Balances

The system checks balances on startup and logs warnings for low balances. To manually check:

1. Use blockchain explorer (e.g., Snowscan for Avalanche)
2. Search for wallet address
3. Check token holdings

### Refilling Wallets

When balances run low:

1. Send tokens to wallet address from another source
2. No need to restart the system
3. System will use new balance in next payment

## 🔐 Security Best Practices

### Private Key Management

**Never commit private keys to version control:**

```bash
# .gitignore already includes:
config.json
.env
```

**For Production:**

1. Use environment variables:
   ```bash
   export WALLET_1_KEY="0x..."
   export WALLET_2_KEY="0x..."
   ```

2. Use key management services (AWS KMS, HashiCorp Vault, etc.)

3. Use hardware wallets for high-value operations

### Network Security

- Run behind firewall
- Use VPN for remote access
- Monitor for unauthorized access
- Keep dependencies updated

### Operational Security

- Start with small amounts for testing
- Monitor logs regularly
- Set reasonable rate limits
- Use testnet first

## 🚨 Troubleshooting

### "Configuration file not found"

**Solution:** Create `config.json` from `config.example.json`

```bash
cp config.example.json config.json
```

### "Insufficient balance"

**Solution:** Send more tokens to the wallet

1. Get wallet address from logs
2. Send tokens from another wallet
3. Verify balance on blockchain explorer

### "Verification failed: Invalid signature"

**Causes:**
- Wrong private key format
- Private key doesn't match wallet
- Network mismatch

**Solution:** Verify private key is correct and has `0x` prefix

### "Settlement failed: Nonce already used"

**Cause:** Payment was already processed (replay protection)

**Solution:** This is normal if payment succeeded. Check blockchain explorer.

### "Facilitator wallet insufficient funds"

**Cause:** X402 facilitator is out of gas tokens

**Solution:** Wait for facilitator to be refunded, or contact support

### "Network timeout"

**Causes:**
- RPC node down
- Network connectivity issues
- Facilitator service down

**Solution:**
1. Check RPC URL is correct
2. Try different RPC endpoint
3. Check facilitator service status

## 📈 Production Deployment

### Running as a Service

**Using systemd (Linux):**

1. Create service file `/etc/systemd/system/mesh-payments.service`:

```ini
[Unit]
Description=Mesh Payment System
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/mesh-payments
ExecStart=/usr/bin/node /path/to/mesh-payments/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start:

```bash
sudo systemctl enable mesh-payments
sudo systemctl start mesh-payments
sudo systemctl status mesh-payments
```

**Using PM2 (Node.js process manager):**

```bash
npm install -g pm2
pm2 start dist/index.js --name mesh-payments
pm2 save
pm2 startup
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t mesh-payments .
docker run -d --name mesh-payments -v $(pwd)/config.json:/app/config.json mesh-payments
```

### Monitoring

1. **Log Monitoring:**
   ```bash
   tail -f logs/mesh-payments.log
   ```

2. **Process Monitoring:**
   ```bash
   pm2 monit  # If using PM2
   ```

3. **Blockchain Monitoring:**
   - Monitor wallet balances
   - Check transaction history
   - Set up alerts for low balances

## 🔧 Advanced Configuration

### Using Environment Variables

Create `.env` file:

```bash
WALLET_1_KEY=0x...
WALLET_2_KEY=0x...
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

Modify `config.json` to use environment variables (requires code changes).

### Custom Token Approval

To manually approve tokens (instead of auto-approve):

1. Set `approveTokensOnStartup: false`
2. Manually approve via script or blockchain explorer
3. Approve amount: `2^256 - 1` (unlimited)

### Rate Limiting

To avoid detection as automated activity:

- Increase `minDelaySeconds` and `maxDelaySeconds`
- Use prime numbers for more natural randomness
- Vary amounts significantly (wider range)

## 📚 Additional Resources

- [X402 Payment Flow Documentation](../X402_PAYMENT_FLOW.md)
- [Agent SDK Documentation](https://github.com/your-repo/agent-sdk)
- [Avalanche Documentation](https://docs.avax.network/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🆘 Support

For issues or questions:

1. Check troubleshooting section
2. Review logs in `logs/mesh-payments.log`
3. Check blockchain explorer for transaction status
4. Open an issue on GitHub

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Test thoroughly on testnet before using on mainnet. Be aware of:

- Smart contract risks
- Facilitator service dependency
- Network congestion
- Token price volatility
- Regulatory compliance in your jurisdiction

## 📄 License

MIT License - See LICENSE file for details

# x402-populator
