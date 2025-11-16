#!/bin/bash

# Backend Setup and Validation Script
# This script installs dependencies and validates the setup

set -e  # Exit on error

echo "🚀 Finance Manager Backend - Setup Script"
echo "=========================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   ✅ Node.js: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "   ✅ npm: $NPM_VERSION"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "   ✅ Dependencies installed"
echo ""

# Run type checking
echo "🔍 Running TypeScript type checking..."
npm run typecheck
echo "   ✅ Type checking passed"
echo ""

# Run linter
echo "🎨 Running ESLint..."
npm run lint
echo "   ✅ Linting passed"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test
echo "   ✅ All tests passed"
echo ""

# Run build
echo "🔨 Building project..."
npm run build
echo "   ✅ Build successful"
echo ""

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Start development server: npm run dev"
echo "   2. Run tests with coverage: npm run test:coverage"
echo "   3. Read BACKEND-SETUP-GUIDE.md for more info"
echo ""
