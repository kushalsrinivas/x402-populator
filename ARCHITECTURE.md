# Mesh Payment System - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mesh Payment Engine                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet 1   │  │   Wallet 2   │  │   Wallet 3   │          │
│  │              │  │              │  │              │          │
│  │ 0x1234...    │  │ 0xabcd...    │  │ 0x9876...    │          │
│  │ USDT: 100    │  │ USDT: 200    │  │ USDT: 150    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                            ▼                                     │
│                  ┌──────────────────┐                           │
│                  │ Random Selection │                           │
│                  │                  │                           │
│                  │ • Pick Wallet    │                           │
│                  │ • Pick Token     │                           │
│                  │ • Pick Recipient │                           │
│                  │ • Pick Amount    │                           │
│                  └────────┬─────────┘                           │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────┐
         │    X402 Payment Protocol          │
         │                                   │
         │  Step 1: Create Signed Payload    │
         │  ┌─────────────────────────────┐  │
         │  │ • EIP-712 signature         │  │
         │  │ • Nonce for uniqueness      │  │
         │  │ • validUntil timestamp      │  │
         │  └─────────────────────────────┘  │
         │            │                       │
         │            ▼                       │
         │  Step 2: Verify with Facilitator  │
         │  ┌─────────────────────────────┐  │
         │  │ • Check signature           │  │
         │  │ • Check balance             │  │
         │  │ • Check allowance           │  │
         │  │ • Check nonce               │  │
         │  └─────────────────────────────┘  │
         │            │                       │
         │            ▼                       │
         │  Step 3: Settle On-chain          │
         │  ┌─────────────────────────────┐  │
         │  │ • Facilitator submits TX    │  │
         │  │ • Facilitator pays gas      │  │
         │  │ • Token transfer executes   │  │
         │  └─────────────────────────────┘  │
         └────────────┬──────────────────────┘
                      │
                      ▼
         ┌──────────────────────────────┐
         │     Recipients Receive       │
         │                              │
         │  ┌────────────────────────┐  │
         │  │  0x1111... ✅ Received │  │
         │  │  0x2222... ✅ Received │  │
         │  │  0x3333... ✅ Received │  │
         │  │  0x4444... ✅ Received │  │
         │  │  0x5555... ✅ Received │  │
         │  └────────────────────────┘  │
         └──────────────────────────────┘
```

## Payment Flow Sequence

```
┌────────┐          ┌──────────────┐          ┌─────────────┐          ┌────────────┐
│ Wallet │          │ Payment      │          │ Facilitator │          │ Blockchain │
│        │          │ Engine       │          │             │          │            │
└───┬────┘          └──────┬───────┘          └──────┬──────┘          └─────┬──────┘
    │                      │                         │                       │
    │                      │                         │                       │
    │  1. Random Selection │                         │                       │
    │◄─────────────────────┤                         │                       │
    │                      │                         │                       │
    │  2. Create Signature │                         │                       │
    ├─────────────────────►│                         │                       │
    │   (EIP-712 signed)   │                         │                       │
    │                      │                         │                       │
    │                      │  3. Verify Payment      │                       │
    │                      ├────────────────────────►│                       │
    │                      │   (Check signature,     │                       │
    │                      │    balance, allowance)  │                       │
    │                      │                         │                       │
    │                      │  4. Verification OK ✅  │                       │
    │                      │◄────────────────────────┤                       │
    │                      │                         │                       │
    │                      │                         │  5. Submit TX         │
    │                      │                         ├──────────────────────►│
    │                      │                         │  (Facilitator pays    │
    │                      │                         │   gas fee)            │
    │                      │                         │                       │
    │                      │                         │  6. TX Confirmed ✅   │
    │                      │                         │◄──────────────────────┤
    │                      │                         │                       │
    │                      │  7. Settlement Success  │                       │
    │                      │◄────────────────────────┤                       │
    │                      │   (TX Hash: 0xabc...)   │                       │
    │                      │                         │                       │
    │  8. Log Success ✅   │                         │                       │
    │◄─────────────────────┤                         │                       │
    │                      │                         │                       │
    │                      │  9. Wait Random Delay   │                       │
    │                      │  (30-300 seconds)       │                       │
    │                      │                         │                       │
    │                      │  10. Next Payment ↻     │                       │
    │                      │                         │                       │
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                      Configuration                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ config.json                                           │  │
│  │  • Wallets: [w1, w2, w3]                             │  │
│  │  • Tokens: [USDT, USDC]                              │  │
│  │  • Recipients: [r1, r2, r3, r4, r5]                  │  │
│  │  • Amount: 0.1 - 10.0 USD                            │  │
│  │  • Delay: 30 - 300 seconds                           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Main Process (index.ts)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Load & validate config                            │  │
│  │  • Initialize logger                                 │  │
│  │  • Create MeshPaymentEngine                          │  │
│  │  • Handle shutdown signals (Ctrl+C)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            MeshPaymentEngine (mesh-payment-engine.ts)       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Initialize Phase:                                    │  │
│  │   • Create wallet instances                           │  │
│  │   • Check token balances                              │  │
│  │   • Approve tokens for relayer                        │  │
│  │                                                       │  │
│  │  Payment Loop:                                        │  │
│  │   • Random wallet selection                           │  │
│  │   • Random token selection                            │  │
│  │   • Random recipient selection                        │  │
│  │   • Random amount generation                          │  │
│  │   • Execute X402 payment                              │  │
│  │   • Update statistics                                 │  │
│  │   • Random delay                                      │  │
│  │   • Repeat ↻                                          │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────┬──────────────────────┘
                   │                   │
        ┌──────────▼─────────┐  ┌─────▼──────────┐
        │  Logger            │  │  Agent SDK     │
        │  (logger.ts)       │  │                │
        │  • Console output  │  │  • X402 client │
        │  • File logging    │  │  • Wallet mgmt │
        │  • Statistics      │  │  • Provider    │
        └────────────────────┘  └────────────────┘
```

## Data Flow

```
Configuration
     │
     ├─► Wallets ──┐
     │             │
     ├─► Tokens ───┤
     │             ├──► Random Selection Engine
     ├─► Recipients┤         │
     │             │         ▼
     └─► Settings ─┘    Payment Parameters
                         │
                         ├─► From: Wallet 2
                         ├─► To: 0x3333...
                         ├─► Token: USDT
                         └─► Amount: 5.23
                              │
                              ▼
                         X402 Protocol
                              │
                              ├─► Sign (free)
                              ├─► Verify (free)
                              └─► Settle (facilitator pays gas)
                                   │
                                   ▼
                              On-chain Transfer
                                   │
                                   ▼
                              Recipient Receives
                                   │
                                   ▼
                              Update Stats & Logs
                                   │
                                   ▼
                              Wait Random Delay
                                   │
                                   └──► Loop Back ↻
```

## State Management

```
┌────────────────────────────────────────┐
│         Wallet State (per wallet)      │
├────────────────────────────────────────┤
│  • address: string                     │
│  • name: string                        │
│  • privateKey: string                  │
│  • balances: Map<token, bigint>        │
│  • nonces: Map<token, Set<string>>     │
│  • lastPaymentTime: number             │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│         Engine Statistics              │
├────────────────────────────────────────┤
│  • totalPayments: number               │
│  • successfulPayments: number          │
│  • failedPayments: number              │
│  • totalAmount: number                 │
│  • startTime: number                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│         Payment Result                 │
├────────────────────────────────────────┤
│  • success: boolean                    │
│  • transactionHash?: string            │
│  • error?: string                      │
│  • fromWallet: string                  │
│  • toAddress: string                   │
│  • tokenSymbol: string                 │
│  • amount: string                      │
│  • timestamp: Date                     │
└────────────────────────────────────────┘
```

## Error Handling Flow

```
Execute Payment
     │
     ├─► Check Balance
     │   ├─ Insufficient ──► Log Error ──► Skip Payment
     │   └─ Sufficient ───┐
     │                    │
     └───────────────────►├─► Create Payload
                          │   ├─ Error ──► Retry Logic
                          │   └─ Success ┐
                          │              │
                          ├─► Verify     │
                          │   ├─ Invalid ──► Log Error ──► Retry Logic
                          │   └─ Valid ──┐
                          │              │
                          ├─► Settle     │
                          │   ├─ Failed ──► Retry Logic
                          │   └─ Success ┐
                          │              │
                          ▼              ▼
                    Update Balance    Log Success
                          │              │
                          └──────┬───────┘
                                 │
                                 ▼
                          Update Statistics
                                 │
                                 ▼
                          Continue Loop
```

## Retry Logic

```
Attempt Payment
     │
     ├─► Try 1 ────► Fail ──┐
     │                      │
     │   Wait 60s           │
     │                      │
     ├─► Try 2 ────► Fail ──┤
     │                      │
     │   Wait 120s          │
     │                      │
     ├─► Try 3 ────► Fail ──┤
     │                      │
     │                      ▼
     │              Final Failure
     │                   │
     │                   ▼
     │              Log Error
     │                   │
     │                   ▼
     │           Continue to Next
     │
     └─► Success ──► Log & Continue
```

## Logging Architecture

```
┌────────────────────────────────────────┐
│            Logger                      │
├────────────────────────────────────────┤
│                                        │
│  Console Output          File Output  │
│  ┌──────────────┐       ┌──────────┐  │
│  │ • Info       │       │ Append   │  │
│  │ • Success    │       │ to File  │  │
│  │ • Warning    │  ────►│          │  │
│  │ • Error      │       │ logs/    │  │
│  │ • Payment    │       │ *.log    │  │
│  └──────────────┘       └──────────┘  │
│                                        │
│  Formatting                            │
│  [Timestamp] [Level] Message           │
└────────────────────────────────────────┘
```

## Deployment Architecture

### Development
```
Local Machine
└─► npm run dev
    └─► ts-node runs TypeScript directly
        └─► Hot reload on changes
```

### Production (PM2)
```
Server
└─► PM2 Process Manager
    ├─► Auto-restart on crash
    ├─► Log management
    ├─► Cluster mode (optional)
    └─► Startup script
```

### Production (Docker)
```
Docker Container
├─► Node.js 18 Alpine
├─► App files
├─► Volume: config.json (persistent)
├─► Volume: logs/ (persistent)
└─► Auto-restart policy
```

### Production (Systemd)
```
Linux Service
├─► systemd unit file
├─► Auto-start on boot
├─► Restart on failure
└─► Log to journald
```

## Security Layers

```
┌────────────────────────────────────────────────┐
│              Security Layers                   │
├────────────────────────────────────────────────┤
│                                                │
│  1. Configuration Security                     │
│     • .gitignore excludes config.json          │
│     • Private keys never logged                │
│     • Environment variable support             │
│                                                │
│  2. Transaction Security                       │
│     • EIP-712 signature standard               │
│     • Nonce prevents replay attacks            │
│     • Time-based expiration                    │
│     • On-chain signature verification          │
│                                                │
│  3. Operational Security                       │
│     • Balance checks before payment            │
│     • Retry limits prevent runaway             │
│     • Graceful error handling                  │
│     • Comprehensive audit logs                 │
│                                                │
│  4. Network Security                           │
│     • HTTPS for facilitator API                │
│     • RPC endpoint authentication              │
│     • Rate limiting considerations             │
│                                                │
└────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌────────────────────────────────────────────┐
│        Performance Metrics                 │
├────────────────────────────────────────────┤
│                                            │
│  Payment Speed:                            │
│  • Signature creation: <100ms              │
│  • Verification: 200-500ms                 │
│  • Settlement: 2-10s (network dependent)   │
│  • Total per payment: ~5-15s               │
│                                            │
│  Throughput:                               │
│  • With 60s min delay: ~60 payments/hour   │
│  • With 300s max delay: ~12 payments/hour  │
│  • Average: ~24-36 payments/hour           │
│                                            │
│  Resource Usage:                           │
│  • Memory: ~50-100MB                       │
│  • CPU: Minimal (<5%)                      │
│  • Network: ~10KB per payment              │
│  • Disk: Log files grow over time          │
│                                            │
└────────────────────────────────────────────┘
```

This architecture is designed for reliability, scalability, and continuous operation while maintaining security and monitoring capabilities.

