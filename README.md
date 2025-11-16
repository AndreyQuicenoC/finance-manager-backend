# Finance Manager Backend

Backend service for personal finance manager application, built with **Node.js**, **TypeScript**, and **Express**.

## 🚀 Tech Stack

- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Testing**: Jest + Supertest
- **Linting**: ESLint with TypeScript support
- **Code Quality**: SonarCloud (80% coverage threshold)

## 📋 Prerequisites

- Node.js >= 18.x
- npm >= 9.x

## 🛠️ Installation

```bash
# Install dependencies
npm install
```

## 🏃 Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## ✅ Quality Checklist (BEFORE every PR/Push)

**Every developer MUST run these commands before pushing:**

```bash
# 1. Run linter (fix errors)
npm run lint

# 2. Build the project
npm run build

# 3. Run tests with coverage
npm run test:coverage
```

### Coverage Requirements
- ✅ **New code coverage**: ≥ 80%
- ✅ **Statements**: ≥ 80%
- ✅ **Branches**: ≥ 80%
- ✅ **Functions**: ≥ 80%
- ✅ **Lines**: ≥ 80%

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# View coverage report (after running test:coverage)
# Open coverage/lcov-report/index.html in browser
```

## 📊 Code Quality

- **SonarCloud** analyzes every PR to `main`
- **Quality Gate** must pass before merging
- Coverage file: `coverage/lcov.info`
- Configuration: `sonar-project.properties`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | Type-check without emitting files |

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express app configuration
│   └── index.ts           # Entry point
├── coverage/              # Test coverage reports
├── dist/                  # Compiled JavaScript
├── jest.config.ts         # Jest configuration
├── tsconfig.json          # TypeScript configuration
├── .eslintrc.json         # ESLint configuration
└── package.json
```

## 🧹 Code Standards

### Writing Tests
- ✅ Write tests for all new features
- ✅ Test controllers, services, and utilities
- ✅ Mock external dependencies
- ✅ Follow AAA pattern (Arrange, Act, Assert)

### TypeScript
- ✅ Use strict mode
- ✅ Define proper interfaces/types
- ✅ Avoid `any` type (use `unknown` if needed)
- ✅ Enable all strict checks

### ESLint
- ✅ No unused variables
- ✅ No console.log (use logger)
- ✅ Proper error handling
- ✅ Consistent code style

## 🔄 Development Workflow

1. Create feature branch from `main`:
   ```bash
   git checkout -b feature/US-XX-description
   ```

2. Develop + write tests (TDD recommended)

3. Run quality checks:
   ```bash
   npm run lint
   npm run build
   npm run test:coverage
   ```

4. Verify coverage ≥ 80%

5. Commit and push:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/US-XX-description
   ```

6. Create PR to `main`

7. Wait for CI/CD checks:
   - ✅ Lint
   - ✅ Build
   - ✅ Tests
   - ✅ SonarCloud Quality Gate

8. Get code review approval

9. Merge when all checks pass ✅

## 📚 Additional Documentation

- [Contributing Guidelines](CONTRIBUTING.MD)
- [Code Quality Guide](BACKEND-CONTRIBUTING-QUALITY.md)

## 🆘 Troubleshooting

### Tests fail locally
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### ESLint errors
```bash
# Auto-fix most issues
npm run lint:fix
```

### TypeScript errors
```bash
# Check types without building
npm run typecheck
```

## 📝 License

[License Type]

