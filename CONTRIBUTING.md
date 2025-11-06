# Contributing to ng-indexeddb-signals

Thank you for your interest in contributing to ng-indexeddb-signals! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone git@github.com:YOUR_USERNAME/ng-indexeddb-signals.git`
3. Navigate to the project: `cd ng-indexeddb-signals`
4. Install dependencies: `pnpm install`
5. Create a new branch: `git checkout -b feat/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.15.0 or higher (specified in `packageManager` field)
- Git

### Installing Dependencies

```bash
pnpm install
```

### Available Scripts

- `pnpm build` - Build the library
- `pnpm build:demo` - Build the demo application
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run unit tests in watch mode
- `pnpm test:coverage` - Run unit tests with coverage report
- `pnpm e2e` - Run end-to-end tests
- `pnpm e2e:ui` - Run end-to-end tests with Playwright UI
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint and fix auto-fixable issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm clean` - Clean generated files and folders
- `pnpm clean:all` - Clean all files including node_modules

## Development Workflow

1. **Create a feature branch** from `main` using git-flow naming:

   ```bash
   git checkout -b feature/your-feature-name
   ```

   **Branch naming convention** (enforced by pre-push hook):
   - `feature/feature-name` - New features
   - `bugfix/bug-name` - Bug fixes
   - `hotfix/hotfix-name` - Hotfixes
   - `release/release-name` - Release branches
   - `chore/chore-name` - Maintenance tasks
   - `docs/docs-name` - Documentation changes
   - `refactor/refactor-name` - Code refactoring
   - `test/test-name` - Test-related changes
   - `perf/perf-name` - Performance improvements
   - `ci/ci-name` - CI/CD changes
   - `build/build-name` - Build system changes

   **⚠️ Important Branch Protection Rules:**
   - Direct commits to `main`, `master`, or `develop` are **not allowed**
   - All changes must be made via feature branches and merged through pull requests
   - **Only `release/*` branches can merge into `main` or `master`**
   - Feature/bugfix/hotfix branches should merge into `develop`
   - This is enforced by pre-commit hooks, pre-push hooks, and GitHub workflows

2. **Make your changes** following the code style guidelines

3. **Run tests and linting** before committing:

   ```bash
   pnpm lint
   pnpm test
   pnpm e2e
   ```

4. **Commit your changes** using conventional commit format (enforced by Husky)

5. **Push your branch**:

   ```bash
   git push -u origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub
   - **Branch targeting rules:**
     - Feature/bugfix/hotfix branches → target `develop`
     - Release branches → target `main` or `master` (only way to update main)
   - Source branch must follow git-flow naming convention
   - All CI checks must pass before merging
   - At least one approval may be required (depending on repository settings)
   - **Use the appropriate PR template** based on your branch type:
     - `feature/*` → Use "Feature" template
     - `bugfix/*` → Use "Bug Fix" template
     - `release/*` → Use "Release" template
     - `hotfix/*` → Use "Hotfix" template
     - `chore/*`, `docs/*`, `refactor/*`, etc. → Use "Chore / Maintenance" template

   **Example workflow:**
   ```bash
   # Feature development
   git checkout -b feature/new-feature
   # ... make changes ...
   git push origin feature/new-feature
   # Create PR: feature/new-feature → develop
   # Select "Feature" template when creating PR

   # Release process
   git checkout develop
   git checkout -b release/1.0.0
   # ... prepare release ...
   git push origin release/1.0.0
   # Create PR: release/1.0.0 → main
   # Select "Release" template when creating PR
   ```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Follow Angular style guide conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer explicit types over `any`

### Formatting

- Code is automatically formatted with Prettier
- Run `pnpm format` before committing
- Prettier configuration is in `.prettierrc`

### ESLint

- ESLint rules are enforced via `eslint.config.mjs`
- Run `pnpm lint` to check for issues
- Run `pnpm lint:fix` to auto-fix issues
- All linting errors must be resolved before committing

### Angular Conventions

- Use standalone components/services
- Prefer dependency injection over direct instantiation
- Use Angular Signals for reactive state
- Follow zoneless patterns (no Zone.js)

## Testing

### Unit Tests

- All new features must include unit tests
- Tests are written using Vitest
- Test files should be named `*.spec.ts`
- Aim for 85% code coverage minimum
- Run tests with: `pnpm test`

### E2E Tests

- Critical user flows should have E2E tests
- E2E tests are written using Playwright
- Test files are in the `e2e/` directory
- Run E2E tests with: `pnpm e2e`

### Test Coverage

- Maintain at least 85% code coverage
- Coverage thresholds are configured in `vitest.config.ts`
- Run coverage report: `pnpm test:coverage`

### Writing Tests

- Follow the AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies appropriately

## Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) format. Commit messages must follow this structure:

```
<type>(<scope>): <subject>
```

### Types

- `feat` - A new feature
- `fix` - A bug fix
- `chore` - Changes to build process or auxiliary tools
- `docs` - Documentation only changes
- `style` - Code style changes (formatting, missing semicolons, etc)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system or external dependencies
- `revert` - Revert a previous commit

### Examples

```
feat: add IndexedDB service
fix(store): handle connection errors
chore: update dependencies
docs: update README
test: add unit tests for IndexedDBService
```

### Commit Message Validation

- Commit messages are validated by Husky `commit-msg` hook
- Invalid commit messages will be rejected
- See `.husky/commit-msg` for validation rules

### Linear Commit History

- **Merge commits are not allowed**
- Use `git rebase` instead of `git merge` when updating your branch
- Linear history is enforced by pre-push hook and CI
- If you need to update your branch:
  ```bash
  git fetch origin
  git rebase origin/main
  ```

## Pull Request Process

1. **Ensure all checks pass**:
   - Linting passes
   - All tests pass (unit and E2E)
   - Code coverage meets threshold
   - Linear commit history

2. **Update documentation** if needed:
   - Update README.md for new features
   - Add JSDoc comments for new APIs
   - Update examples if applicable

3. **Write a clear PR description**:
   - Describe what changes were made
   - Explain why the changes were needed
   - Reference any related issues
   - Include screenshots if UI changes

4. **Keep PRs focused**:
   - One feature or bug fix per PR
   - Keep changes small and reviewable
   - Avoid unrelated changes

5. **Respond to feedback**:
   - Address review comments promptly
   - Make requested changes
   - Rebase if needed to keep history linear

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test` and `pnpm e2e`)
- [ ] Code coverage meets 85% threshold
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] Branch has linear commit history (no merge commits)
- [ ] PR targets the correct branch:
  - [ ] Feature/bugfix/hotfix branches target `develop`
  - [ ] Release branches target `main` or `master` (only way to update main)

## Reporting Bugs

When reporting bugs, please include:

1. **Clear description** of the bug
2. **Steps to reproduce**:
   - What you did
   - What you expected to happen
   - What actually happened
3. **Environment information**:
   - Angular version
   - Node.js version
   - Browser (if applicable)
   - OS
4. **Minimal reproduction** (if possible):
   - Code example or StackBlitz link
   - Screenshots or error messages

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment**

- Angular version: [e.g. 20.0.0]
- Node.js version: [e.g. 20.10.0]
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14.0]

**Additional context**
Add any other context about the problem here.
```

## Suggesting Features

When suggesting features, please include:

1. **Clear description** of the feature
2. **Use case** - Why is this feature needed?
3. **Proposed solution** - How should it work?
4. **Alternatives considered** - What other approaches did you consider?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## Code Review

All code submissions require review. Reviewers will check for:

- Code quality and style
- Test coverage
- Documentation
- Performance implications
- Breaking changes
- Security concerns

## Questions?

If you have questions about contributing:

- Open an issue for discussion
- Check existing issues and PRs
- Review the README.md for project overview

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ng-indexeddb-signals! 🎉
