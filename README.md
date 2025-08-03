# Slim Lint for VS Code

A Visual Studio Code extension that provides real-time linting for Slim template files using [slim-lint](https://github.com/sds/slim-lint).

![Demo GIF](https://drive.google.com/uc?export=view&id=1-2YvJzWVsaBu9xOLLFc1OTU7UobOgTmJ)

## Features

- **Real-time linting**: Get instant feedback as you type
- **Error highlighting**: Visual indicators for syntax errors and style violations
- **Warning support**: Distinguish between errors and warnings
- **Configuration support**: Use your project's `.slim-lint.yml` configuration
- **Multiple executable support**: Works with `slim-lint`, `bundle exec slim-lint`, and `gem exec slim-lint`
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Performance optimized**: Efficient linting with timeout protection

## Prerequisites

Before using this extension, you need to have `slim-lint` installed on your system:

### Installing slim-lint

```bash
# Install via RubyGems
gem install slim_lint

# Or if using Bundler, add to your Gemfile
gem 'slim_lint'
bundle install
```

### System Requirements

- **Ruby**: Version 2.0 or higher
- **slim-lint**: Latest version recommended
- **VS Code**: Version 1.32.0 or higher

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Slim Lint"
4. Click Install

## Configuration

### Extension Settings

The extension can be configured through VS Code settings:

| Setting                      | Default          | Description                          |
| ---------------------------- | ---------------- | ------------------------------------ |
| `slimLint.executablePath`    | `slim-lint`      | Path to slim-lint executable         |
| `slimLint.configurationPath` | `.slim-lint.yml` | Path to slim-lint configuration file |

### Configuration Examples

#### Basic Configuration

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```

#### Using Bundler

```json
{
  "slimLint.executablePath": "bundle exec slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```

#### Custom Configuration Path

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": "/path/to/custom/slim-lint.yml"
}
```

### slim-lint Configuration

Create a `.slim-lint.yml` file in your project root to configure linting rules:

```yaml
# .slim-lint.yml
linters:
  LineLength:
    enabled: true
    max: 120

  TrailingWhitespace:
    enabled: true

  TrailingBlankLines:
    enabled: true

  RuboCop:
    enabled: true
    ignored_cops:
      - 'Layout/LineLength'
```

## Usage

### Automatic Linting

The extension automatically lints your Slim files when:

- You open a `.slim` file
- You save a `.slim` file
- You make changes to a `.slim` file

### Manual Linting

You can manually trigger linting by:

1. Opening the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Typing "Slim Lint: Run Linter"
3. Selecting the command

### Viewing Issues

Linting issues are displayed as:

- **Errors**: Red underlines and entries in the Problems panel
- **Warnings**: Yellow underlines and entries in the Problems panel

Hover over underlined code to see the full error message.

## Troubleshooting

### Common Issues

#### "slim-lint executable not found"

**Solution**: Install slim-lint globally or update your executable path setting.

```bash
# Install globally
gem install slim_lint

# Or update VS Code settings
{
  "slimLint.executablePath": "bundle exec slim-lint"
}
```

#### "Configuration file not found"

**Solution**: Create a `.slim-lint.yml` file in your project root or update the configuration path setting.

#### "Permission denied"

**Solution**: Check file permissions and ensure slim-lint is executable.

```bash
# Make slim-lint executable
chmod +x $(which slim-lint)
```

#### "Execution timed out"

**Solution**: The linting process is taking too long. This can happen with large files or complex configurations.

- Check your `.slim-lint.yml` configuration
- Consider excluding large files
- Update the timeout setting if needed

### Debugging

Enable debug logging by opening the Output panel and selecting "Slim Lint" from the dropdown. This will show detailed information about the linting process.

### Performance Tips

1. **Use appropriate configuration**: Avoid enabling unnecessary linters
2. **Exclude large files**: Add large files to your `.slim-lint.yml` exclusions
3. **Use Bundler**: If your project uses Bundler, use `bundle exec slim-lint`
4. **Optimize your setup**: Ensure slim-lint is properly installed and accessible

## Supported File Types

- `.slim` - Standard Slim template files
- `.html.slim` - HTML Slim template files

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile TypeScript: `npm run compile`
4. Run tests: `npm test`
5. Lint code: `npm run lint`

### Testing

The extension includes comprehensive tests. Run them with:

```bash
npm test
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes.

## License

This extension is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/aliariff/vscode-slim-lint/issues)
- **Documentation**: [slim-lint Documentation](https://github.com/sds/slim-lint)
- **VS Code Extensions**: [Extension Marketplace](https://marketplace.visualstudio.com/)

## Related Extensions

- [Slim](https://marketplace.visualstudio.com/items?itemName=sianglim.slim) - Slim syntax highlighting
- [Ruby](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby) - Ruby language support
- [Ruby Solargraph](https://marketplace.visualstudio.com/items?itemName=castwide.solargraph) - Ruby language server
