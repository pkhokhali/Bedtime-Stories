const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request.endsWith('.mp4') || request.endsWith('.png') || request.endsWith('.jpg')) {
    return request;
  }
  return originalRequire.apply(this, arguments);
};

require('ts-node').register({
  compilerOptions: { module: 'commonjs' },
  transpileOnly: true
});

const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.json');
tsConfigPaths.register({
  baseUrl: './',
  paths: tsConfig.compilerOptions.paths
});

const { stories } = require('./data/catalog.ts');

const finalStories = stories.map(s => {
  const { beats, mediaAssets, ...rest } = s;
  return { ...rest, isHidden: false };
});

fetch('https://saanjh-api.prabinkhokhali89.workers.dev/catalog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ version: 1, stories: finalStories })
}).then(res => res.text()).then(console.log).catch(console.error);
