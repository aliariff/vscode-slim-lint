import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Suppress Electron/Chromium warnings
    process.env.ELECTRON_DISABLE_SANDBOX = 'true';
    process.env.ELECTRON_NO_ATTACH_CONSOLE = 'true';
    process.env.ELECTRON_ENABLE_LOGGING = 'false';

    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-features=TranslateUI',
      ],
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
