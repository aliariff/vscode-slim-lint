# Contributing to Slim Lint for VS Code

Thank you for your interest in contributing to the Slim Lint VS Code extension! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to the Contributor Covenant code of conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher
- **Ruby**: Version 2.0 or higher
- **slim-lint**: Latest version
- **VS Code**: Latest version

### Installing slim-lint

```bash
# Install slim-lint globally
gem install slim_lint

# Or install via Bundler
gem 'slim_lint'
bundle install
```

## Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/vscode-slim-lint.git
   cd vscode-slim-lint
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Compile the extension**

   ```bash
   npm run compile
   ```

4. **Open in VS Code**

   ```bash
   code .
   ```

5. **Run the extension**
   - Press `F5` to start debugging
   - This opens a new VS Code window with your extension loaded

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --grep "Linter Test Suite"
```

### Test Structure

- **Unit Tests**: Located in `src/test/suite/`
- **Integration Tests**: Test real slim-lint execution
- **Fixtures**: Test files in `src/test/fixtures/`

### Writing Tests

When adding new features, include corresponding tests:

```typescript
test('Should handle new feature', async () => {
  // Arrange
  const document = createMockDocument('slim', 'test content', 'test.slim');

  // Act
  const result = await linter.run(document);

  // Assert
  assert.strictEqual(result.length, 1);
});
```

### Test Guidelines

- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Test both success and failure scenarios
- Use fixture files for complex test cases
- Ensure tests are deterministic

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public methods
- Use interfaces for object shapes

### Code Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### File Organization

```
src/
├── extension.ts      # Main extension entry point
├── linter.ts         # Core linting logic
└── test/
    ├── fixtures/     # Test files
    ├── runTest.ts    # Test runner
    └── suite/        # Test suites
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**

   ```bash
   npm test
   npm run lint
   npm run format:check
   ```

2. **Update documentation**
   - Update README.md if needed
   - Add comments for new features
   - Update CHANGELOG.md

3. **Test your changes**
   - Test in VS Code debug mode
   - Verify linting works correctly
   - Check error handling

### Pull Request Guidelines

1. **Create a descriptive title**
   - Use present tense ("Add feature" not "Added feature")
   - Be specific about the change

2. **Write a clear description**
   - Explain what the PR does
   - Include any breaking changes
   - Reference related issues

3. **Include tests**
   - Add tests for new features
   - Update existing tests if needed
   - Ensure good test coverage

4. **Follow the template**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - [ ] Tests pass
   - [ ] Manual testing completed
   - [ ] No breaking changes

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   ```

### Review Process

1. **Automated checks must pass**
   - Tests
   - Linting
   - Formatting

2. **Code review**
   - At least one maintainer must approve
   - Address all review comments

3. **Merge**
   - Squash commits if requested
   - Use conventional commit messages

## Release Process

### Version Management

- Follow [Semantic Versioning](https://semver.org/)
- Update version in `package.json`
- Update CHANGELOG.md

### Release Steps

1. **Prepare release**

   ```bash
   npm run compile
   npm test
   ```

2. **Update version**

   ```bash
   npm version patch|minor|major
   ```

3. **Update CHANGELOG.md**
   - Move unreleased changes to new version
   - Add release date

4. **Create release**
   - Tag the release
   - Create GitHub release
   - Publish to VS Code marketplace

## Reporting Issues

### Bug Reports

When reporting bugs, include:

- **VS Code version**
- **Extension version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages/logs**

### Feature Requests

For feature requests:

- **Describe the feature**
- **Explain the use case**
- **Consider alternatives**
- **Check if it's already planned**

### Issue Template

```markdown
## Environment

- VS Code: [version]
- Extension: [version]
- OS: [version]

## Description

[Describe the issue or feature request]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior

[What you expected to happen]

## Actual Behavior

[What actually happened]

## Additional Information

[Any other relevant information]
```

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Documentation**: Check README.md and inline comments

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to the Slim Lint VS Code extension!
