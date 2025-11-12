# Contributing Guidelines

## Branching Strategy
This project follows **Trunk-Based Development**.
All changes must be developed in short-lived branches and merged into `main` through Pull Requests (PRs).

### Branch Naming Convention
Use the following format for your branches:
feature/US-XX-short-description
fix/bug-short-description
chore/task-short-description

Example:
feature/US-10-join-meeting-by-id

## Pull Request Rules
- All code changes must go through a Pull Request.
- Each PR must have at least **1 approval**.
- SonarCloud checks must pass before merging.
- Include the corresponding **Taiga User Story ID** in the PR title or description.

Example:
[US-10] Join Meeting by ID (Meeting Management Epic)

## Code Review
- The assigned **CODEOWNERS** must review and approve the PR.
- Follow established design patterns and linting rules.
- Write unit tests for every new feature or bug fix.

## Commit Convention
Use clear, descriptive commits:
feat: implement login with Google OAuth
fix: handle null pointer in meeting creation
refactor: improve state management in chat component

# Contributing Guidelines

## Branching Strategy
This project follows **Trunk-Based Development**.
All changes must be developed in short-lived branches and merged into `main` through Pull Requests (PRs).

### Branch Naming Convention
Use the following format for your branches:
feature/US-XX-short-description
fix/bug-short-description
chore/task-short-description

Example:

## Pull Request Rules
- All code changes must go through a Pull Request (PR).
- Each PR must have at least **1 approval** from the corresponding CODEOWNER.
- SonarCloud and CI/CD checks must pass before merging.
- Include the corresponding **Taiga User Story ID** in the PR title or description.

Example:
[US-10] Join Meeting by ID (Meeting Management Epic)

## Code Review
- The assigned **CODEOWNERS** must review and approve the PR.
- Follow established design patterns and linting rules.
- Write unit tests for every new feature or bug fix.
- Check that your code maintains or improves test coverage (minimum 60%).

## Commit Convention
Use clear, descriptive commits:
feat: implement login with Google OAuth
fix: handle null pointer in meeting creation
refactor: improve state management in chat component

## Workflow Example
1. Create a branch from `main`:
   ```bash
   git checkout -b feature/US-09-create-meeting
2. Develop your feature locally.

3. Push the branch:
   git push origin feature/US-09-create-meeting
4. Open a Pull Request to main and request a review from the designated CODEOWNER.