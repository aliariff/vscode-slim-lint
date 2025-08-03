# Troubleshooting Guide

This guide helps you resolve common issues with the Slim Lint VS Code extension.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Common Issues](#common-issues)
- [Configuration Problems](#configuration-problems)
- [Performance Issues](#performance-issues)
- [Debugging](#debugging)
- [Getting Help](#getting-help)

## Quick Diagnosis

### Check Extension Status

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Slim Lint"
4. Verify the extension is installed and enabled

### Check slim-lint Installation

```bash
# Test slim-lint installation
slim-lint --version

# If using Bundler
bundle exec slim-lint --version

# If using gem
gem exec slim-lint --version
```

### Check Configuration

1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "slim lint"
3. Verify settings are configured correctly

## Common Issues

### Issue: Extension Not Activating

**Symptoms:**

- No linting occurs on Slim files
- Extension doesn't appear in output panel
- No error messages displayed

**Solutions:**

1. **Check VS Code Version**

   ```bash
   # Ensure VS Code 1.32.0 or higher
   code --version
   ```

2. **Verify slim-lint Installation**

   ```bash
   # Install slim-lint globally
   gem install slim_lint

   # Or add to Gemfile
   gem 'slim_lint'
   bundle install
   ```

3. **Check File Associations**
   - Ensure `.slim` files are recognized
   - Check language mode in VS Code status bar
   - Should show "Slim" for `.slim` files

4. **Restart VS Code**
   - Close VS Code completely
   - Reopen and try again

### Issue: "slim-lint executable not found"

**Symptoms:**

- Error message: "slim-lint executable not found"
- No linting results
- Extension shows error in output panel

**Solutions:**

1. **Install slim-lint**

   ```bash
   # Install globally
   gem install slim_lint

   # Verify installation
   which slim-lint
   slim-lint --version
   ```

2. **Update Executable Path**

   ```json
   {
     "slimLint.executablePath": "bundle exec slim-lint"
   }
   ```

3. **Check PATH Environment**

   ```bash
   # Add Ruby gems to PATH
   export PATH="$PATH:$(ruby -e 'puts Gem.user_dir')/bin"

   # Or use rbenv/rvm
   rbenv rehash
   ```

4. **Windows-specific Issues**
   ```bash
   # Ensure Ruby is in PATH
   # Install Ruby via RubyInstaller
   # Add Ruby and gem bin directories to PATH
   ```

### Issue: "Configuration file not found"

**Symptoms:**

- Warning about missing configuration file
- Using default slim-lint settings
- No custom rules applied

**Solutions:**

1. **Create Configuration File**

   ```bash
   # Create .slim-lint.yml in project root
   touch .slim-lint.yml
   ```

2. **Basic Configuration**

   ```yaml
   # .slim-lint.yml
   linters:
     LineLength:
       enabled: true
       max: 120

     TrailingWhitespace:
       enabled: true
   ```

3. **Update Configuration Path**

   ```json
   {
     "slimLint.configurationPath": "/path/to/your/.slim-lint.yml"
   }
   ```

4. **Check File Permissions**
   ```bash
   # Ensure file is readable
   chmod 644 .slim-lint.yml
   ls -la .slim-lint.yml
   ```

### Issue: "Permission denied"

**Symptoms:**

- Error: "Permission denied"
- slim-lint cannot execute
- Configuration file not readable

**Solutions:**

1. **Fix File Permissions**

   ```bash
   # Make slim-lint executable
   chmod +x $(which slim-lint)

   # Fix configuration file permissions
   chmod 644 .slim-lint.yml
   ```

2. **Check Directory Permissions**

   ```bash
   # Ensure project directory is accessible
   ls -la .
   chmod 755 .
   ```

3. **Run as Administrator (Windows)**
   - Right-click VS Code
   - Select "Run as administrator"

### Issue: "Execution timed out"

**Symptoms:**

- Linting takes too long
- Timeout error messages
- Extension becomes unresponsive

**Solutions:**

1. **Optimize Configuration**

   ```yaml
   # .slim-lint.yml
   linters:
     # Disable slow linters
     RuboCop:
       enabled: false

     # Exclude large files
     exclude:
       - 'vendor/**/*'
       - 'node_modules/**/*'
   ```

2. **Exclude Large Files**

   ```yaml
   # .slim-lint.yml
   exclude:
     - '**/*.min.slim'
     - 'vendor/**/*'
     - 'tmp/**/*'
   ```

3. **Use Bundler**
   ```json
   {
     "slimLint.executablePath": "bundle exec slim-lint"
   }
   ```

## Configuration Problems

### Issue: Custom Configuration Not Applied

**Symptoms:**

- Default rules still active
- Custom settings ignored
- Configuration file not recognized

**Solutions:**

1. **Verify Configuration Path**

   ```json
   {
     "slimLint.configurationPath": "/absolute/path/to/.slim-lint.yml"
   }
   ```

2. **Check YAML Syntax**

   ```yaml
   # Valid .slim-lint.yml
   linters:
     LineLength:
       enabled: true
       max: 120

     TrailingWhitespace:
       enabled: true
   ```

3. **Test Configuration**
   ```bash
   # Test configuration manually
   slim-lint --config .slim-lint.yml test.slim
   ```

### Issue: Multiple Configuration Files

**Symptoms:**

- Conflicting rules
- Unexpected behavior
- Multiple .slim-lint.yml files

**Solutions:**

1. **Specify Exact Path**

   ```json
   {
     "slimLint.configurationPath": "/project/root/.slim-lint.yml"
   }
   ```

2. **Remove Duplicate Files**

   ```bash
   # Find all configuration files
   find . -name ".slim-lint.yml" -o -name "slim-lint.yml"

   # Remove duplicates
   rm duplicate/.slim-lint.yml
   ```

3. **Use Project-specific Configuration**
   ```yaml
   # .slim-lint.yml in project root
   linters:
     LineLength:
       enabled: true
       max: 120
   ```

## Performance Issues

### Issue: Slow Linting

**Symptoms:**

- Linting takes several seconds
- VS Code becomes unresponsive
- High CPU usage

**Solutions:**

1. **Optimize Configuration**

   ```yaml
   # .slim-lint.yml
   linters:
     # Disable expensive linters
     RuboCop:
       enabled: false

     # Use faster alternatives
     LineLength:
       enabled: true
       max: 120
   ```

2. **Exclude Directories**

   ```yaml
   # .slim-lint.yml
   exclude:
     - 'vendor/**/*'
     - 'node_modules/**/*'
     - 'tmp/**/*'
     - 'log/**/*'
   ```

3. **Use Bundler**
   ```json
   {
     "slimLint.executablePath": "bundle exec slim-lint"
   }
   ```

### Issue: Memory Usage

**Symptoms:**

- High memory consumption
- VS Code becomes slow
- Extension crashes

**Solutions:**

1. **Restart VS Code**
   - Close VS Code completely
   - Reopen project

2. **Check File Sizes**

   ```bash
   # Find large Slim files
   find . -name "*.slim" -size +1M
   ```

3. **Exclude Large Files**
   ```yaml
   # .slim-lint.yml
   exclude:
     - '**/*.large.slim'
     - 'generated/**/*'
   ```

## Debugging

### Enable Debug Logging

1. **Open Output Panel**
   - View → Output (Ctrl+Shift+U / Cmd+Shift+U)
   - Select "Slim Lint" from dropdown

2. **Check Log Messages**
   - Look for error messages
   - Check execution commands
   - Verify configuration paths

### Manual Testing

1. **Test slim-lint Directly**

   ```bash
   # Test with a simple file
   echo "doctype html" > test.slim
   slim-lint test.slim
   ```

2. **Test Configuration**

   ```bash
   # Test with configuration
   slim-lint --config .slim-lint.yml test.slim
   ```

3. **Check Environment**

   ```bash
   # Check Ruby version
   ruby --version

   # Check gem environment
   gem env

   # Check PATH
   echo $PATH
   ```

### Common Debug Commands

```bash
# Check slim-lint installation
which slim-lint
slim-lint --version

# Check Ruby gems
gem list slim_lint

# Test configuration
slim-lint --config .slim-lint.yml --show-linters

# Check file permissions
ls -la .slim-lint.yml
ls -la $(which slim-lint)

# Test with verbose output
slim-lint --verbose test.slim
```

## Getting Help

### Before Asking for Help

1. **Check this guide** for your specific issue
2. **Enable debug logging** and check output panel
3. **Test slim-lint manually** to isolate the issue
4. **Check your configuration** for syntax errors

### Information to Include

When reporting issues, include:

- **VS Code version**
- **Extension version**
- **Operating system**
- **Ruby version**
- **slim-lint version**
- **Configuration files**
- **Error messages**
- **Steps to reproduce**

### Example Issue Report

````markdown
## Environment

- VS Code: 1.85.0
- Extension: 0.3.0
- OS: macOS 14.0
- Ruby: 3.2.0
- slim-lint: 0.22.0

## Issue

Extension not linting Slim files

## Steps to Reproduce

1. Open a .slim file
2. Make changes
3. Save file
4. No linting occurs

## Error Messages

From output panel: "slim-lint executable not found"

## Configuration

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```
````

## Manual Test

```bash
slim-lint --version
# Output: slim-lint 0.22.0
```

```

### Support Channels

- **GitHub Issues**: [Report bugs](https://github.com/aliariff/vscode-slim-lint/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/aliariff/vscode-slim-lint/discussions)
- **Documentation**: [slim-lint docs](https://github.com/sds/slim-lint)

### Useful Resources

- [slim-lint Documentation](https://github.com/sds/slim-lint)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Ruby Installation Guide](https://www.ruby-lang.org/en/documentation/installation/)
- [Bundler Documentation](https://bundler.io/)

---

This troubleshooting guide should help you resolve most issues with the Slim Lint VS Code extension. If you're still experiencing problems, please report them with the information requested above.
```
