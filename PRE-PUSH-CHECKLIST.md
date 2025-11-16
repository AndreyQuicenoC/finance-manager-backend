# PRE-PUSH CHECKLIST

This document outlines the mandatory steps every team member MUST complete before pushing code or creating a Pull Request.

---

## Required Steps Before Push/PR

### 1. Run ESLint
```bash
npm run lint
```
- Must pass with zero errors
- Fix all linting issues before proceeding
- Use `npm run lint:fix` for auto-fixable issues

### 2. Build the Project
```bash
npm run build
```
- TypeScript compilation must succeed
- No type errors allowed
- Verify dist folder is generated

### 3. Run Tests with Coverage
```bash
npm run test:coverage
```
- All tests must pass
- Coverage must be >= 80% for all metrics:
  - Statements >= 80%
  - Branches >= 80%
  - Functions >= 80%
  - Lines >= 80%
- Verify coverage/lcov.info file is generated

### 4. Automated Check Script
Alternatively, run the complete validation script:
```bash
./pre-commit-check.sh
```
This script runs all checks automatically and reports the results.

---

## GitHub Actions CI/CD

### Pull Request Workflow
When you create a PR to `main`, the following will run automatically:

1. **Lint and Build Job**
   - Checkout code
   - Install dependencies
   - Run ESLint
   - Build TypeScript
   - Run tests with coverage

2. **SonarCloud Analysis Job** (if SONAR_TOKEN is configured)
   - Run tests with coverage
   - Upload coverage to SonarCloud
   - Analyze code quality
   - Check Quality Gate (must pass)

### Required GitHub Secrets
The repository needs these secrets configured:

**For SonarCloud:**
- `SONAR_TOKEN` - Authentication token from SonarCloud

**For Deployment (optional):**
- `RENDER_API_KEY` - Render deployment key
- `RENDER_SERVICE_ID` - Render service identifier

---

## Quality Gates

### PR Cannot Be Merged If:
- Linting fails
- Build fails
- Tests fail
- Coverage < 80% on new code
- SonarCloud Quality Gate fails
- No code review approval (minimum 1 required)

### PR Can Be Merged When:
- All CI checks pass (green)
- Code coverage >= 80%
- SonarCloud Quality Gate passes
- At least 1 approval from CODEOWNERS
- No merge conflicts

---

## Common Issues and Solutions

### Linting Errors
```bash
# Auto-fix most issues
npm run lint:fix

# Check specific file
npm run lint -- src/path/to/file.ts
```

### TypeScript Compilation Errors
```bash
# Run type check without building
npm run typecheck

# Check for unused imports/variables
npm run lint
```

### Test Failures
```bash
# Run tests in watch mode during development
npm run test:watch

# Run specific test file
npm test -- src/path/to/file.test.ts

# Clear Jest cache if needed
npm test -- --clearCache
```

### Coverage Below 80%
- Write tests for uncovered code
- Check coverage report: `open coverage/lcov-report/index.html`
- Focus on new code you added

---

## Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/US-XX-description

# 2. Develop and write tests (TDD recommended)
npm run test:watch

# 3. Before committing, run quality checks
./pre-commit-check.sh

# 4. Commit your changes
git add .
git commit -m "feat: add new feature"

# 5. Push to remote
git push origin feature/US-XX-description

# 6. Create Pull Request on GitHub
# - Wait for CI checks to complete
# - Address any failures
# - Request code review

# 7. After approval and green checks
# - Merge to main
# - Delete feature branch
```

---

## File Structure for Tests

Every source file should have a corresponding test file:

```
src/
├── controllers/
│   ├── user.controller.ts
│   └── user.controller.test.ts      # Test file
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts         # Test file
└── utils/
    ├── validators.ts
    └── validators.test.ts           # Test file
```

---

## Test Writing Guidelines

### Controllers
- Test all HTTP methods (GET, POST, PUT, DELETE)
- Test success responses (200, 201)
- Test error responses (400, 404, 500)
- Test input validation

### Services
- Test business logic
- Test data transformations
- Test error handling
- Mock external dependencies

### Utilities
- Test all input scenarios
- Test edge cases
- Test null/undefined handling
- Test error conditions

---

## SonarCloud Configuration

The project uses `sonar-project.properties` for configuration:

- Project Key: `IvanAusechaS_finance-manager-backend`
- Organization: `ivanausechas`
- Coverage Path: `coverage/lcov.info`
- Excluded Files: tests, node_modules, dist, index.ts

SonarCloud will fail if:
- Code coverage on new code < 80%
- Security vulnerabilities found
- Code smells exceed threshold
- Bugs detected

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix linting issues |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `./pre-commit-check.sh` | Run all quality checks |
| `./setup.sh` | Initial project setup |

---

## Contact

If you encounter issues not covered here:
1. Check project documentation (README.md, BACKEND-SETUP-GUIDE.md)
2. Review CODEOWNERS file for responsible team members
3. Ask in team chat or create an issue

---

**Remember: Quality is not optional. All checks must pass before merging.**
