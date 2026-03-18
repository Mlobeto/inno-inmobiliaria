const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Agregar el directorio shared como watchFolder
const sharedPath = path.resolve(__dirname, '../shared');

config.watchFolders = [sharedPath];

// Asegurar que resuelve node_modules correctamente
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../shared/node_modules'),
];

// Soporte para CSS de NativeWind
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'css'];

module.exports = config;
