#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Config } from './types';
import { Logger } from './logger';
import { MeshPaymentEngine } from './mesh-payment-engine';
import { validateConfig } from './utils';

/**
 * Main entry point for the mesh payment system
 */
async function main() {
  console.log('🚀 Mesh Payment System Starting...\n');

  // Load configuration
  const configPath = process.env.CONFIG_PATH || path.join(__dirname, 'config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Configuration file not found: ${configPath}`);
    console.error('Please create config.json from config.example.json');
    process.exit(1);
  }

  let config: Config;
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
  } catch (error: any) {
    console.error('❌ Failed to load configuration:', error.message);
    process.exit(1);
  }

  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Configuration loaded and validated\n');

  // Initialize logger
  const logPath = path.join(__dirname, 'logs', config.logging.logFile);
  const logger = new Logger(
    logPath,
    config.logging.verbose,
    config.logging.enabled
  );

  // Create engine
  const engine = new MeshPaymentEngine(config, logger);

  // Handle graceful shutdown
  let shutdownInProgress = false;
  
  const gracefulShutdown = async () => {
    if (shutdownInProgress) return;
    shutdownInProgress = true;

    console.log('\n\n🛑 Shutdown signal received...');
    engine.stop();
    
    // Give time for final logs
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('👋 Goodbye!\n');
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);  // Ctrl+C
  process.on('SIGTERM', gracefulShutdown); // Kill signal

  try {
    // Initialize the engine
    await engine.initialize();

    // Start the payment loop
    await engine.start();
  } catch (error: any) {
    logger.error('Fatal error', error);
    console.error('\n❌ Fatal error:', error.message);
    
    if (error.stack) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

