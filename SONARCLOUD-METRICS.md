# SonarCloud Metrics Guide

## 📊 Overview

This document explains the quality metrics measured by SonarCloud in our CI/CD pipeline, as required by the project specifications.

## 🎯 Project Requirements

According to the project task:
- ✅ Configure SonarCloud in pipeline
- ✅ Measure cyclomatic complexity
- ✅ Measure code coverage (must exceed 60%)
- ✅ Measure code duplication
- ✅ Measure technical debt
- ✅ Measure code smells

## 📈 Metrics Explained

### 1. Cyclomatic Complexity

**What is it?**
Cyclomatic complexity measures the number of independent paths through a program's source code. It's calculated by counting the number of decision points (if, for, while, case, etc.) plus 1.

**Example:**
```typescript
// Complexity = 1 (simple function, no decisions)
function add(a: number, b: number): number {
  return a + b;
}

// Complexity = 3 (two if statements + 1)
function validateUser(user: User): boolean {
  if (!user.email) return false;  // +1
  if (user.age < 18) return false; // +1
  return true;
}

// Complexity = 7 (too complex!)
function processTransaction(transaction: Transaction): Result {
  if (!transaction) return error;           // +1
  if (transaction.amount <= 0) return error; // +1
  if (transaction.type === 'income') {      // +1
    if (transaction.verified) {             // +1
      return processIncome(transaction);
    } else {
      if (transaction.amount > 1000) {      // +1
        return requiresReview;
      }
    }
  } else if (transaction.type === 'expense') { // +1
    return processExpense(transaction);
  }
  return success;
}
```

**Our Threshold:** Maximum **10** per function

**Why it matters:**
- High complexity = harder to understand
- High complexity = harder to test
- High complexity = more bugs
- High complexity = harder to maintain

**How to improve:**
- Break large functions into smaller ones
- Extract complex conditions into named functions
- Use early returns to reduce nesting
- Apply the Single Responsibility Principle

### 2. Code Coverage

**What is it?**
Code coverage measures the percentage of your code that is executed during automated tests.

**Types of coverage:**
- **Line Coverage**: % of lines executed
- **Branch Coverage**: % of decision branches tested (if/else)
- **Function Coverage**: % of functions called
- **Statement Coverage**: % of statements executed

**Example:**
```typescript
// Function to test
export function calculateDiscount(price: number, userType: string): number {
  if (price <= 0) {
    throw new Error("Price must be positive");
  }
  
  if (userType === "premium") {
    return price * 0.8; // 20% discount
  }
  
  return price; // No discount
}

// Test with 100% coverage
describe("calculateDiscount", () => {
  it("should throw error for negative price", () => {
    expect(() => calculateDiscount(-10, "regular")).toThrow();
  });
  
  it("should apply 20% discount for premium users", () => {
    expect(calculateDiscount(100, "premium")).toBe(80);
  });
  
  it("should not apply discount for regular users", () => {
    expect(calculateDiscount(100, "regular")).toBe(100);
  });
});
```

**Our Requirements:**
- **Minimum:** 60% (project requirement)
- **Target:** 80% (our quality standard)

**How to check:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

**How to improve:**
- Write unit tests for all new functions
- Test edge cases and error conditions
- Mock external dependencies
- Focus on business logic first

### 3. Code Duplication

**What is it?**
Code duplication detects repeated code blocks across the codebase.

**Example of duplication:**
```typescript
// BAD: Duplicated code
function createUser(name: string, email: string) {
  if (!name || name.trim() === "") {
    throw new Error("Name is required");
  }
  if (!email || email.trim() === "") {
    throw new Error("Email is required");
  }
  // create user...
}

function createProduct(name: string, description: string) {
  if (!name || name.trim() === "") {
    throw new Error("Name is required");
  }
  if (!description || description.trim() === "") {
    throw new Error("Description is required");
  }
  // create product...
}

// GOOD: Extracted common validation
function validateRequired(value: string, fieldName: string): void {
  if (!value || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }
}

function createUser(name: string, email: string) {
  validateRequired(name, "Name");
  validateRequired(email, "Email");
  // create user...
}

function createProduct(name: string, description: string) {
  validateRequired(name, "Name");
  validateRequired(description, "Description");
  // create product...
}
```

**Our Threshold:** Minimum 50 tokens to consider duplication

**How to improve:**
- Extract common code into utility functions
- Use inheritance or composition
- Create reusable components
- Follow the DRY principle (Don't Repeat Yourself)

### 4. Technical Debt

**What is it?**
Technical debt is the estimated time required to fix all code quality issues. It's calculated based on the number and severity of:
- Bugs
- Vulnerabilities
- Code Smells

**Debt Ratio Formula:**
```
Debt Ratio = (Remediation Cost / Development Cost) × 100
```

**Rating Scale:**
- **A**: Debt ratio ≤ 5% (Excellent)
- **B**: Debt ratio ≤ 10% (Good)
- **C**: Debt ratio ≤ 20% (Average)
- **D**: Debt ratio ≤ 50% (Poor)
- **E**: Debt ratio > 50% (Very Poor)

**Example:**
If SonarCloud estimates it will take 2 hours to fix all issues, and the codebase took 100 hours to develop:
```
Debt Ratio = (2h / 100h) × 100 = 2% → Rating A
```

**Our Target:** Rating **A** (≤ 5%)

**How to improve:**
- Fix issues as soon as they appear
- Address high-priority issues first
- Refactor regularly
- Follow code review feedback

### 5. Code Smells

**What is it?**
Code smells are indicators of potential problems in code that don't cause bugs but affect maintainability.

**Common Code Smells:**

#### Cognitive Complexity (Brain Overload)
```typescript
// BAD: High cognitive complexity
function processOrder(order: Order) {
  if (order.isPaid) {
    if (order.items.length > 0) {
      for (const item of order.items) {
        if (item.inStock) {
          if (item.quantity > 0) {
            // process item...
          }
        }
      }
    }
  }
}

// GOOD: Reduced complexity with early returns
function processOrder(order: Order) {
  if (!order.isPaid) return;
  if (order.items.length === 0) return;
  
  const stockedItems = order.items.filter(item => 
    item.inStock && item.quantity > 0
  );
  
  stockedItems.forEach(item => processItem(item));
}
```

#### Too Many Parameters
```typescript
// BAD: Too many parameters
function createTransaction(
  amount: number,
  type: string,
  date: Date,
  userId: number,
  accountId: number,
  tagId: number,
  description: string,
  verified: boolean
) {
  // ...
}

// GOOD: Use an object
interface TransactionData {
  amount: number;
  type: string;
  date: Date;
  userId: number;
  accountId: number;
  tagId: number;
  description: string;
  verified: boolean;
}

function createTransaction(data: TransactionData) {
  // ...
}
```

#### Long Functions
```typescript
// BAD: Function too long (> 50 lines)
function processUserRegistration(userData: UserData) {
  // 100+ lines of validation, processing, email sending, etc.
}

// GOOD: Split into smaller functions
function processUserRegistration(userData: UserData) {
  validateUserData(userData);
  const user = createUser(userData);
  sendWelcomeEmail(user);
  logRegistration(user);
  return user;
}
```

**How to improve:**
- Keep functions small and focused
- Use descriptive variable names
- Reduce nesting levels
- Extract complex conditions
- Limit parameter count (max 3-4)

### 6. Reliability Rating

**What is it?**
Measures the density and severity of bugs in the code.

**Rating Scale:**
- **A**: 0 bugs
- **B**: At least 1 minor bug
- **C**: At least 1 major bug
- **D**: At least 1 critical bug
- **E**: At least 1 blocker bug

**Our Target:** Rating **A**

### 7. Security Rating

**What is it?**
Measures the density and severity of security vulnerabilities.

**Rating Scale:**
- **A**: 0 vulnerabilities
- **B**: At least 1 minor vulnerability
- **C**: At least 1 major vulnerability
- **D**: At least 1 critical vulnerability
- **E**: At least 1 blocker vulnerability

**Common Security Issues:**
- SQL Injection vulnerabilities
- Cross-Site Scripting (XSS)
- Insecure dependencies
- Hardcoded credentials
- Weak encryption

**Our Target:** Rating **A**

## 🔍 Viewing Metrics in SonarCloud

### Access the Dashboard

1. **Go to SonarCloud:**
   - URL: https://sonarcloud.io/
   - Login with GitHub account

2. **Navigate to Project:**
   - Organization: `ivanausechas`
   - Project: `IvanAusechaS_finance-manager-backend`

3. **View Metrics:**
   - **Overview**: Summary of all metrics
   - **Issues**: List of bugs, vulnerabilities, code smells
   - **Measures**: Detailed metric history
   - **Code**: Browse code with inline issues
   - **Activity**: Recent analysis history

### Understanding the Quality Gate

The Quality Gate is a set of conditions that must be met before code can be merged.

**Our Quality Gate Conditions:**
- ✅ Coverage on new code ≥ 60%
- ✅ Duplicated lines on new code ≤ 3%
- ✅ Maintainability rating = A
- ✅ Reliability rating = A
- ✅ Security rating = A
- ✅ Security hotspots reviewed = 100%

**Status Indicators:**
- 🟢 **Passed**: All conditions met
- 🔴 **Failed**: One or more conditions not met

## 📝 Configuration Files

### sonar-project.properties
```properties
# Project identification
sonar.projectKey=IvanAusechaS_finance-manager-backend
sonar.organization=ivanausechas

# Source and test paths
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.spec.ts

# Exclusions
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.minimum=60.0

# Complexity
sonar.javascript.complexity.threshold=10

# Quality thresholds
sonar.maintainability.rating.threshold=A
sonar.reliability.rating.threshold=A
sonar.security.rating.threshold=A
```

## 🚀 CI/CD Integration

SonarCloud analysis runs automatically on:
- ✅ Every push to `main` branch
- ✅ Every pull request to `main` branch

**GitHub Actions Workflow:** `.github/workflows/ci-pr.yml`

```yaml
- name: Run tests to generate coverage
  run: npm run test:coverage

- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@v2
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 🎓 Best Practices

1. **Run tests before pushing:**
   ```bash
   npm run test:coverage
   ```

2. **Check coverage locally:**
   ```bash
   open coverage/lcov-report/index.html
   ```

3. **Fix issues early:**
   - Don't let technical debt accumulate
   - Address SonarCloud issues before code review

4. **Write testable code:**
   - Keep functions small and focused
   - Inject dependencies
   - Avoid side effects

5. **Monitor trends:**
   - Check SonarCloud dashboard regularly
   - Track metric improvements over time

## 📚 Additional Resources

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [Cyclomatic Complexity Explained](https://en.wikipedia.org/wiki/Cyclomatic_complexity)
- [Code Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
- [Clean Code Principles](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

## 🆘 Troubleshooting

### Coverage not showing in SonarCloud
```bash
# Make sure coverage file exists
npm run test:coverage
ls -la coverage/lcov.info
```

### Quality Gate failing
1. Check specific failed condition in SonarCloud
2. Fix issues in code
3. Run tests and validate locally
4. Push changes and wait for new analysis

### High complexity warnings
- Refactor function into smaller ones
- Use early returns
- Extract complex conditions

---

**Last Updated:** November 2025
**Project:** Finance Manager Backend
**Team:** [List team members who contributed]
