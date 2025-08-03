# Slim Lint for VS Code

A Visual Studio Code extension that provides real-time linting for Slim template files using the [slim-lint](https://github.com/sds/slim-lint) gem.

## Features

- **Real-time linting**: Automatically lint Slim files as you type, save, or open them
- **Comprehensive rule support**: Supports all slim-lint rules including LineLength, TrailingWhitespace, Tab, and more
- **Visual feedback**: Displays warnings and errors directly in the editor with proper highlighting
- **Configuration support**: Uses your project's `.slim-lint.yml` configuration file
- **Performance optimized**: Efficient linting with timeout protection and error handling
- **Detailed logging**: Comprehensive output channel for debugging and troubleshooting

![Demo GIF](https://drive.google.com/uc?export=view&id=1-2YvJzWVsaBu9xOLLFc1OTU7UobOgTmJ)

## Installation

### Prerequisites

1. **Install slim-lint gem**:

   ```bash
   gem install slim_lint
   ```

2. **Install the VS Code extension**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Slim Lint"
   - Click Install

### Alternative Installation Methods

- **Bundle installation**: If using Bundler, ensure slim-lint is in your Gemfile
- **Gem installation**: Install via `gem install slim_lint` globally or locally

## Configuration

### Extension Settings

The extension can be configured through VS Code settings:

| Setting                      | Description                          | Default          |
| ---------------------------- | ------------------------------------ | ---------------- |
| `slimLint.executablePath`    | Path to slim-lint executable         | `slim-lint`      |
| `slimLint.configurationPath` | Path to slim-lint configuration file | `.slim-lint.yml` |

### Common Configuration Examples

**Basic slim-lint installation**:

```json
{
  "slimLint.executablePath": "slim-lint"
}
```

**Using Bundler**:

```json
{
  "slimLint.executablePath": "bundle exec slim-lint"
}
```

**Custom configuration file**:

```json
{
  "slimLint.configurationPath": "/path/to/custom/.slim-lint.yml"
}
```

### Slim-lint Configuration

Create a `.slim-lint.yml` file in your project root to configure linting rules:

```yaml
# .slim-lint.yml
linters:
  LineLength:
    max: 80
  TrailingWhitespace:
    enabled: true
  Tab:
    enabled: true
  TrailingBlankLines:
    enabled: true
```

## Usage

### Automatic Linting

The extension automatically lints Slim files when:

- You open a `.slim` or `.html.slim` file
- You save a Slim file
- You make changes to a Slim file

### Manual Linting

The linter runs automatically, but you can trigger it manually by:

- Saving the file (Ctrl+S)
- Opening the file
- Making changes to the file

### Viewing Results

- **Inline diagnostics**: Warnings and errors appear directly in the editor
- **Problems panel**: View all issues in the Problems panel (Ctrl+Shift+M)
- **Output channel**: Detailed logs available in "Slim Lint" output channel

## Supported File Types

- `.slim` files
- `.html.slim` files

## Troubleshooting

### Common Issues

**"slim-lint executable not found"**

- Ensure slim-lint is installed: `gem install slim_lint`
- Check your `slimLint.executablePath` setting
- Verify slim-lint is in your PATH

**"Configuration file not found"**

- Create a `.slim-lint.yml` file in your project root
- Check your `slimLint.configurationPath` setting
- Ensure the configuration file is readable

**"Permission denied"**

- Check file permissions on your Slim files
- Ensure slim-lint has execute permissions
- Try running with `bundle exec slim-lint`

**"Execution timed out"**

- Large files may take longer to lint
- Check your slim-lint configuration
- Consider breaking large files into smaller components

### Debugging

1. **Check the output channel**:
   - Open Command Palette (Ctrl+Shift+P)
   - Type "Output: Show Output Channels"
   - Select "Slim Lint"

2. **Verify configuration**:
   - Check VS Code settings for slimLint configuration
   - Verify your `.slim-lint.yml` file exists and is valid
   - Test slim-lint manually in terminal

3. **Test slim-lint manually**:
   ```bash
   slim-lint your-file.slim
   ```

## Development

### Building from Source

1. Clone the repository:

   ```bash
   git clone https://github.com/aliariff/vscode-slim-lint.git
   cd vscode-slim-lint
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile the extension:

   ```bash
   npm run compile
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

## Issues and Support

- **Bug reports**: [GitHub Issues](https://github.com/aliariff/vscode-slim-lint/issues)
- **Feature requests**: [GitHub Issues](https://github.com/aliariff/vscode-slim-lint/issues)
- **Documentation**: [GitHub Wiki](https://github.com/aliariff/vscode-slim-lint/wiki)

## Related

- [slim-lint](https://github.com/sds/slim-lint) - The underlying linting engine
- [Slim](http://slim-lang.com/) - The Slim template language
- [VS Code Extensions](https://code.visualstudio.com/docs/editor/extension-gallery) - Learn more about VS Code extensions
