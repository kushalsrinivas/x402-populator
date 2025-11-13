# Mesh Payments - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Setup
cd mesh-payments
./setup.sh

# Configuration
cp config.example.json config.json
nano config.json  # Edit with your settings

# Run
npm start         # Production
npm run dev       # Development

# Stop
Ctrl+C           # Graceful shutdown
```

## ⚙️ Configuration Checklist

```json
{
  "wallets": [
    { "name": "...", "privateKey": "0x...", "enabled": true }
  ],
  "tokens": [
    { "symbol": "USDT", "address": "0x...", "decimals": 6, "enabled": true }
  ],
  "recipients": ["0x...", "0x...", "0x..."],
  "paymentSettings": {
    "minAmountUSD": 0.1,
    "maxAmountUSD": 10.0,
    "minDelaySeconds": 30,
    "maxDelaySeconds": 300
  }
}
```

## 📊 Console Output Meanings

| Symbol | Meaning |
|--------|---------|
| ✅ | Success - payment completed |
| ❌ | Error - payment failed |
| ⚠️  | Warning - issue detected |
| ℹ️  | Info - general information |
| 💰 | Payment - payment activity |
| 🔐 | Security - approval/signature |
| ⏳ | Waiting - delay between payments |

## 🔍 Common Log Messages

```bash
# Good Signs
✅ Engine initialized with 3 wallet(s)
✅ Payment SUCCESS: 0x1234... → 0x5678... | 5.23 USDT | TX: 0xabc...
ℹ️  USDT balance: 100.000000

# Warnings
⚠️  Low USDT balance in Wallet 1 - only 2.5 available
⚠️  Payment already made, skipping...

# Errors
❌ Payment failed: Insufficient balance
❌ Verification failed: Invalid signature
❌ Settlement failed: Nonce already used
```

## 🛠️ Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Config file not found" | Run `cp config.example.json config.json` |
| "Insufficient balance" | Send more tokens to wallet |
| "Invalid signature" | Check private key format (needs `0x` prefix) |
| "Nonce already used" | Payment already processed, check explorer |
| "Facilitator out of gas" | Wait for facilitator to be refunded |
| "Network timeout" | Check RPC URL, try different endpoint |

## 📈 Statistics Dashboard

```bash
--------------------------------------------------------------------------------
📊 Statistics:
   Total Payments: 50          # All payment attempts
   Successful: 48 (96.00%)     # Success rate
   Failed: 2                   # Failed attempts
   Total Amount: $234.56       # Total USD sent
   Runtime: 3456s              # Uptime in seconds
--------------------------------------------------------------------------------
```

## 🔐 Security Checklist

- [ ] Private keys in config.json, not in code
- [ ] config.json in .gitignore
- [ ] Test on testnet first
- [ ] Start with small amounts
- [ ] Monitor logs regularly
- [ ] Backup configuration securely
- [ ] Use strong server security
- [ ] Keep dependencies updated

## 📁 Important Files

| File | Purpose |
|------|---------|
| `config.json` | Your configuration (DO NOT COMMIT) |
| `logs/mesh-payments.log` | Detailed activity log |
| `dist/` | Compiled JavaScript (auto-generated) |
| `node_modules/` | Dependencies (auto-generated) |

## 🌐 Network Information

### Avalanche Fuji (Testnet)
- Chain ID: 43113
- RPC: `https://api.avax-test.network/ext/bc/C/rpc`
- Explorer: https://testnet.snowscan.xyz/
- USDT: `0x40dAE5db31DD56F1103Dd9153bd806E00A2f07BA`
- Relayer: `0x8BD697733c31293Be2327026d01aE393Ab2675C4`

### Avalanche Mainnet (Production)
- Chain ID: 43114
- RPC: `https://api.avax.network/ext/bc/C/rpc`
- Explorer: https://snowscan.xyz/
- Update config.json with mainnet addresses

## 💡 Pro Tips

1. **Testing**: Use verbose logging (`"verbose": true`) during testing
2. **Production**: Increase delays (120-600s) to avoid rate limiting
3. **Monitoring**: Check logs every 10 payments for statistics
4. **Balances**: System warns when balance is low (< 10x min payment)
5. **Recipients**: More recipients = better distribution variety
6. **Delays**: Random delays make activity appear more natural

## 🔄 Deployment Methods

### Method 1: PM2 (Recommended)
```bash
npm install -g pm2
pm2 start dist/index.js --name mesh-payments
pm2 save
pm2 logs mesh-payments  # View logs
pm2 restart mesh-payments  # Restart
pm2 stop mesh-payments  # Stop
```

### Method 2: Screen (Simple)
```bash
screen -S mesh-payments
npm start
# Ctrl+A, D to detach
screen -r mesh-payments  # Reattach
```

### Method 3: Docker
```bash
docker build -t mesh-payments .
docker run -d --name mesh-payments \
  -v $(pwd)/config.json:/app/config.json \
  mesh-payments
```

## 📞 Quick Help

| Question | Answer |
|----------|--------|
| How to stop? | Press `Ctrl+C` |
| Where are logs? | `logs/mesh-payments.log` |
| How to change settings? | Edit `config.json`, restart |
| How to add wallet? | Add to config, restart (auto-approves) |
| How to check balance? | Check on blockchain explorer |
| Test before production? | Use Fuji testnet first |

## 🎯 Common Configurations

### Conservative (Safe)
```json
{
  "minAmountUSD": 0.1,
  "maxAmountUSD": 1.0,
  "minDelaySeconds": 120,
  "maxDelaySeconds": 600
}
```

### Moderate (Balanced)
```json
{
  "minAmountUSD": 1.0,
  "maxAmountUSD": 10.0,
  "minDelaySeconds": 60,
  "maxDelaySeconds": 300
}
```

### Aggressive (Fast)
```json
{
  "minAmountUSD": 5.0,
  "maxAmountUSD": 50.0,
  "minDelaySeconds": 30,
  "maxDelaySeconds": 120
}
```

## 🧪 Testing Checklist

- [ ] Configuration loads without errors
- [ ] All wallets initialize successfully
- [ ] Token balances display correctly
- [ ] First payment completes successfully
- [ ] Transaction appears on blockchain explorer
- [ ] Recipient receives tokens
- [ ] Logs record all activity
- [ ] Statistics update correctly
- [ ] Ctrl+C stops gracefully
- [ ] Can restart without issues

## 📊 Monitoring Commands

```bash
# View live logs
tail -f logs/mesh-payments.log

# Count total payments
grep "Payment SUCCESS" logs/mesh-payments.log | wc -l

# View errors only
grep "ERROR" logs/mesh-payments.log

# Check running status (PM2)
pm2 status

# View process stats (PM2)
pm2 monit
```

## 🆘 Emergency Procedures

### If System Hangs
```bash
Ctrl+C  # Try graceful shutdown
# If no response:
kill -9 $(pgrep -f "mesh-payments")
```

### If Balance Depletes
1. Send more tokens to wallet address
2. System will use new balance automatically
3. No restart needed

### If Too Many Errors
1. Press Ctrl+C to stop
2. Check logs: `tail -100 logs/mesh-payments.log`
3. Verify configuration
4. Check wallet balances
5. Test single payment manually
6. Restart when issue resolved

## 📚 Documentation Links

- **Full User Guide**: [README.md](README.md)
- **X402 Protocol**: [../X402_PAYMENT_FLOW.md](../X402_PAYMENT_FLOW.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Complete Summary**: [../MESH_PAYMENTS_SUMMARY.md](../MESH_PAYMENTS_SUMMARY.md)

## 🎓 Key Concepts

**X402**: Gasless payment protocol where facilitator pays gas fees

**Mesh Payment**: Multiple wallets sending to multiple recipients randomly

**Nonce**: Unique identifier preventing duplicate payments

**Facilitator**: Backend service that settles X402 payments

**Relayer**: Smart contract that executes token transfers

**EIP-712**: Standard for signing typed structured data

## ⚡ Performance Expectations

- **Payment Speed**: 5-15 seconds per payment
- **Throughput**: 12-60 payments/hour (depending on delays)
- **Memory Usage**: ~50-100MB
- **CPU Usage**: <5%
- **Network**: ~10KB per payment

## ✅ Success Indicators

1. ✅ Payments showing "SUCCESS" status
2. ✅ Transaction hashes appearing
3. ✅ Recipients receiving tokens
4. ✅ Statistics showing high success rate
5. ✅ No repeated errors in logs
6. ✅ Wallet balances decreasing appropriately

---

**Remember**: Always test on testnet first, start with small amounts, and monitor closely!

