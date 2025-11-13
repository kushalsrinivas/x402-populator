import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logFile: string;
  private verbose: boolean;
  private enabled: boolean;

  constructor(logFile: string, verbose: boolean = true, enabled: boolean = true) {
    this.logFile = logFile;
    this.verbose = verbose;
    this.enabled = enabled;

    // Create logs directory if it doesn't exist
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Initialize log file with header
    if (this.enabled) {
      this.writeToFile(`\n${'='.repeat(80)}\n`);
      this.writeToFile(`Mesh Payments Session Started: ${new Date().toISOString()}\n`);
      this.writeToFile(`${'='.repeat(80)}\n\n`);
    }
  }

  private writeToFile(message: string): void {
    if (!this.enabled) return;
    try {
      fs.appendFileSync(this.logFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }

  info(message: string): void {
    const formatted = this.formatMessage('INFO', message);
    if (this.verbose) {
      console.log(`ℹ️  ${message}`);
    }
    this.writeToFile(formatted);
  }

  success(message: string): void {
    const formatted = this.formatMessage('SUCCESS', message);
    console.log(`✅ ${message}`);
    this.writeToFile(formatted);
  }

  warn(message: string): void {
    const formatted = this.formatMessage('WARN', message);
    console.warn(`⚠️  ${message}`);
    this.writeToFile(formatted);
  }

  error(message: string, error?: any): void {
    const formatted = this.formatMessage('ERROR', message);
    console.error(`❌ ${message}`);
    this.writeToFile(formatted);
    
    if (error && this.verbose) {
      const errorDetails = error.stack || error.message || String(error);
      console.error(errorDetails);
      this.writeToFile(`    ${errorDetails}\n`);
    }
  }

  payment(details: {
    from: string;
    to: string;
    token: string;
    amount: string;
    txHash?: string;
    status: 'pending' | 'success' | 'failed';
  }): void {
    const message = `Payment ${details.status.toUpperCase()}: ${details.from.slice(0, 10)}... → ${details.to.slice(0, 10)}... | ${details.amount} ${details.token}${details.txHash ? ` | TX: ${details.txHash}` : ''}`;
    
    if (details.status === 'success') {
      this.success(message);
    } else if (details.status === 'failed') {
      this.error(message);
    } else {
      this.info(message);
    }
  }

  separator(): void {
    const line = '-'.repeat(80);
    if (this.verbose) {
      console.log(line);
    }
    this.writeToFile(`${line}\n`);
  }

  section(title: string): void {
    this.separator();
    const message = `📋 ${title}`;
    console.log(`\n${message}\n`);
    this.writeToFile(`\n${title}\n`);
    this.separator();
  }
}

