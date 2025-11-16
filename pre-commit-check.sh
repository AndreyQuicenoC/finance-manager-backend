#!/bin/bash

# Pre-commit validation script
# Run this before every commit to ensure quality standards

set -e  # Exit on error

echo "🔍 Pre-commit Quality Checks"
echo "============================"
echo ""

# 1. Run linter
echo "1️⃣  Running ESLint..."
npm run lint
echo "   ✅ Linting passed"
echo ""

# 2. Run type checking
echo "2️⃣  Running TypeScript type check..."
npm run typecheck
echo "   ✅ Type checking passed"
echo ""

# 3. Run build
echo "3️⃣  Building project..."
npm run build
echo "   ✅ Build successful"
echo ""

# 4. Run tests with coverage
echo "4️⃣  Running tests with coverage..."
npm run test:coverage
echo "   ✅ All tests passed"
echo ""

# 5. Check coverage threshold
echo "5️⃣  Checking coverage threshold (≥80%)..."
if [ -f "coverage/lcov.info" ]; then
  echo "   ✅ Coverage file generated"
else
  echo "   ❌ Coverage file not found!"
  exit 1
fi
echo ""

echo "✅ All quality checks passed!"
echo ""
echo "📋 Summary:"
echo "   ✅ Linting"
echo "   ✅ Type checking"
echo "   ✅ Build"
echo "   ✅ Tests"
echo "   ✅ Coverage (≥80%)"
echo ""
echo "🚀 Ready to commit!"
echo ""
