/**
 * P5.2: only public values may reach the JS bundle through react-native-dotenv.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_ENV = ['CATALOG_API_URL', 'API_BASE_URL', 'MAPBOX_ACCESS_TOKEN'];
const SECRET_FIELDS = [
  'NOCODB_TOKEN', 'SENDGRID_API_KEY', 'OPENAI_API_KEY', 'UNSPLASH_ACCESS_KEY',
  'SERPAPI_KEY', 'AZURE_TRANSLATOR_KEY', 'PAYOS_BACKEND_URL',
];

function sourceFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {return sourceFiles(full);}
    return /\.(ts|tsx|js)$/.test(entry.name) ? [full] : [];
  });
}

describe('environment allowlist', () => {
  it('babel dotenv plugin only allows public variables', () => {
    const config = require('../babel.config.js');
    const dotenv = config.plugins.find(
      plugin => Array.isArray(plugin) && plugin[0] === 'module:react-native-dotenv',
    );
    expect(dotenv[1].allowlist).toEqual(PUBLIC_ENV);
  });

  it('source imports only allowlisted names from @env', () => {
    const root = path.join(__dirname, '..');
    const files = [...sourceFiles(path.join(root, 'src')), path.join(root, 'App.tsx'), path.join(root, 'index.js')];
    const imported = new Set();
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'@env'/g)) {
        match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)
          .forEach(name => imported.add(name));
      }
    }
    expect([...imported].sort()).toEqual([...PUBLIC_ENV].sort());
  });

  it('paid-service keys are never read into the app', () => {
    const {env} = require('../src/utils/env');
    for (const field of SECRET_FIELDS) {
      expect(env[field]).toBe('');
    }
    // babel inlines the local .env (if any) before jest's moduleNameMapper, so only check shape.
    expect(env.MAPBOX_ACCESS_TOKEN === '' || env.MAPBOX_ACCESS_TOKEN.startsWith('pk.')).toBe(true);
    expect(env.API_BASE_URL).toMatch(/^https:\/\/[^/]+[^/]$/);
  });
});
