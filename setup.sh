#!/bin/bash

# Mesh Payment System Setup Script

echo "🚀 Setting up Mesh Payment System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
echo "✅ Created logs/ directory"
echo ""

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "📝 Creating config.json from example..."
    cp config.example.json config.json
    echo "✅ Created config.json"
    echo ""
    echo "⚠️  IMPORTANT: Edit config.json with your settings before running!"
    echo "   - Add your private keys"
    echo "   - Configure tokens"
    echo "   - Add recipient addresses"
    echo ""
else
    echo "✅ config.json already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
if npm run build; then
    echo "✅ Project built successfully"
    echo ""
else
    echo "❌ Build failed"
    exit 1
fi

# Final instructions
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit config.json with your settings:"
echo "   - Add wallet private keys"
echo "   - Configure tokens and amounts"
echo "   - Add recipient addresses"
echo ""
echo "2. Test configuration (optional):"
echo "   npm run dev"
echo ""
echo "3. Run in production:"
echo "   npm start"
echo ""
echo "4. Stop with Ctrl+C"
echo ""
echo "⚠️  Security Warning:"
echo "   - Never commit config.json with real private keys"
echo "   - Test on testnet first"
echo "   - Start with small amounts"
echo ""
echo "📖 Read README.md for detailed documentation"
echo ""

