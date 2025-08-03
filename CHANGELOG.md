# Changelog

All notable changes to the "Slim Lint for VS Code" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.2] - 2025-08-03

### Fixed

- **CI**: Fixed test compilation issue in CI by compiling test files separately from extension
- Updated package.json scripts to compile tests with TypeScript separately from webpack bundling
- Added compile:tests script for test compilation only
- Updated pretest to use compile:tests instead of full compile
- Updated GitHub workflow to use the new compile command
- Ensures test files are available for CI runs

## [0.4.1] - 2025-08-03

### Fixed

- **Critical**: Fixed "Cannot find module 'execa'" error by implementing webpack bundling
- Added webpack configuration to bundle dependencies with the extension
- Updated build process to use webpack instead of direct TypeScript compilation
- Ensured all dependencies are properly bundled in the published extension

### Changed

- Updated package.json scripts to use webpack for compilation
- Added webpack, webpack-cli, and ts-loader as dev dependencies
- Updated GitHub workflow to use webpack build process
- Updated .vscodeignore to exclude webpack config from package

## [0.4.0] - 2025-08-03

### Added

- Comprehensive documentation improvements
- Contributing guidelines (CONTRIBUTING.md)
- Troubleshooting guide (TROUBLESHOOTING.md)
- API documentation (API.md)
- Performance optimization tips
- Cross-platform support documentation
- Comprehensive test suite with real slim-lint integration
- Test fixtures for various linting scenarios
- Unit tests for output parsing and diagnostic creation
- Integration tests for actual slim-lint execution

### Changed

- Enhanced README with installation instructions
- Improved configuration examples
- Better error handling and user feedback
- Updated CHANGELOG.md to follow Keep a Changelog standards

## [0.3.0] - 2024-01-XX

### Added

- Real-time linting support (on save and open)
- Error and warning highlighting with diagnostic collection
- Configuration file support (.slim-lint.yml)
- Multiple executable support (slim-lint, bundle exec, gem exec)
- Cross-platform compatibility (Windows, macOS, Linux)
- TypeScript implementation
- Process management with WeakMap for cleanup

### Changed

- Complete rewrite from previous versions
- Improved error handling with stderr display
- Enhanced configuration validation
- Better process management and cleanup

### Fixed

- Configuration path resolution for workspace folders
- Process cleanup to prevent hanging
- Error message display in VS Code
- Document change detection during linting

## [0.2.0] - Previous Release

### Added

- Basic linting functionality
- Simple configuration support

### Changed

- Initial TypeScript implementation

## [0.1.0] - Initial Release

### Added

- Basic Slim file linting
- Simple VS Code integration

---

## Release Notes

### Version 0.4.0

This is a documentation-focused release that significantly improves the user experience and developer onboarding.

**Key Improvements:**

- Complete README rewrite with comprehensive installation and usage guides
- New contributing guidelines for developers
- Dedicated troubleshooting guide with common issues and solutions
- Comprehensive API documentation for extension development
- Enhanced changelog following Keep a Changelog standards
- Comprehensive test suite with real slim-lint integration
- Test fixtures covering various linting scenarios and edge cases

**Impact:**

- **Users**: Clear installation, configuration, and troubleshooting guidance
- **Contributors**: Comprehensive development setup and contribution guidelines
- **Maintainers**: Structured documentation management and quality standards
- **Quality**: Comprehensive test coverage ensures reliability and stability

### Version 0.3.0

This is a major release that completely rewrites the extension in TypeScript with improved functionality, better error handling, and process management.

**Key Features:**

- Real-time linting on save and open
- Error and warning highlighting with diagnostic collection
- Support for multiple slim-lint executable types
- Configuration file support (.slim-lint.yml)
- Cross-platform compatibility
- Process management with cleanup

**Breaking Changes:**

- Requires VS Code 1.32.0 or higher
- New TypeScript implementation
- Configuration format has changed

**Migration Guide:**
If you're upgrading from a previous version:

1. Update your VS Code to version 1.32.0 or higher
2. Review your slim-lint configuration
3. Test with a few files to ensure compatibility

### Version 0.2.0

This was an intermediate release with basic TypeScript support and improved linting capabilities.

### Version 0.1.0

The initial release with basic Slim file linting support.

---

## Contributing

To contribute to this changelog, please follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and add your changes under the [Unreleased] section.

### Changelog Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
