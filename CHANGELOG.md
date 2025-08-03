# Change Log

All notable changes to the "vscode-slim-lint" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.3.0] - 2024-12-19

### Added

- **Enhanced error handling**: Improved error messages and user feedback for common issues
- **Configuration validation**: Automatic validation of slim-lint executable and configuration paths
- **Performance monitoring**: Added timing information and performance logging
- **Comprehensive logging**: Detailed output channel for debugging and troubleshooting
- **Timeout protection**: 30-second timeout to prevent hanging processes
- **File size validation**: Warning for large configuration files that may impact performance
- **Executable validation**: Checks for common slim-lint executable patterns
- **Configuration file detection**: Automatic detection of alternative configuration files
- **Real-time linting**: Linting on file open, save, and change events
- **Visual diagnostics**: Proper highlighting of warnings and errors in the editor
- **Problems panel integration**: Issues appear in VS Code's Problems panel

### Changed

- **Improved error messages**: More specific and helpful error messages for different failure scenarios
- **Better configuration handling**: Enhanced support for various slim-lint installation methods
- **Optimized performance**: Reduced unnecessary linting operations and improved efficiency
- **Enhanced file type support**: Better handling of `.slim` and `.html.slim` files

### Fixed

- **Memory leaks**: Proper disposal of resources and diagnostic collections
- **Race conditions**: Better handling of concurrent linting operations
- **Configuration path resolution**: Improved handling of relative and absolute configuration paths
- **Executable path validation**: Better validation of slim-lint executable paths
- **Diagnostic cleanup**: Proper cleanup of diagnostics when files are closed

## [0.2.0] - 2024-12-15

### Added

- **Basic linting functionality**: Core slim-lint integration
- **Configuration support**: Support for `.slim-lint.yml` configuration files
- **Diagnostic display**: Basic error and warning display in the editor
- **File type detection**: Support for `.slim` and `.html.slim` files

### Changed

- **Initial release**: Basic extension functionality

## [0.1.0] - 2024-12-10

### Added

- **Project setup**: Initial extension structure and configuration
- **Basic VS Code integration**: Extension activation and basic file handling
- **Development environment**: TypeScript setup and build configuration

---

## Version History

- **0.3.0**: Current stable release with comprehensive linting features
- **0.2.0**: Basic linting functionality with configuration support
- **0.1.0**: Initial project setup and basic VS Code integration

## Upcoming Features

- **Custom rule support**: Allow users to define custom linting rules
- **Quick fix suggestions**: Automatic fixes for common linting issues
- **Performance improvements**: Further optimization of linting speed
- **Enhanced configuration**: More granular control over linting behavior
