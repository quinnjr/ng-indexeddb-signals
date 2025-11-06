#!/usr/bin/env node

import { rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const foldersToClean = [
  'dist',
  'demo-dist',
  'coverage',
  'test-results',
  'playwright-report',
  '.cache',
  '.temp',
];

function cleanFolders() {
  foldersToClean.forEach((folder) => {
    const fullPath = join(rootDir, folder);
    try {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`✓ Removed ${folder}/`);
    } catch (error) {
      // Ignore errors if folder doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn(`⚠ Warning: Could not remove ${folder}/: ${error.message}`);
      }
    }
  });
}

function cleanFiles() {
  // Clean tsbuildinfo files
  const commonFiles = [
    'tsconfig.tsbuildinfo',
    'tsconfig.lib.tsbuildinfo',
    'tsconfig.demo.tsbuildinfo',
    'tsconfig.spec.tsbuildinfo',
  ];

  commonFiles.forEach((file) => {
    const fullPath = join(rootDir, file);
    try {
      rmSync(fullPath, { force: true });
      console.log(`✓ Removed ${file}`);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if (error.code !== 'ENOENT') {
        // Silent - file doesn't exist
      }
    }
  });

  // Clean .js and .map files from src directory
  function cleanSrcArtifacts(dir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          cleanSrcArtifacts(fullPath);
        } else if (entry.isFile()) {
          if (entry.name.endsWith('.js') || entry.name.endsWith('.js.map')) {
            try {
              rmSync(fullPath, { force: true });
              console.log(`✓ Removed ${fullPath.replace(rootDir + '/', '')}`);
            } catch (error) {
              if (error.code !== 'ENOENT') {
                console.warn(`⚠ Warning: Could not remove ${fullPath}: ${error.message}`);
              }
            }
          }
        }
      });
    } catch (error) {
      // Ignore if directory doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn(`⚠ Warning: Could not read ${dir}: ${error.message}`);
      }
    }
  }

  const srcDir = join(rootDir, 'src');
  cleanSrcArtifacts(srcDir);
}

// Check if --all flag is passed
const cleanAll = process.argv.includes('--all');

if (cleanAll) {
  console.log('Cleaning all generated files and node_modules...\n');
  cleanFolders();
  cleanFiles();

  const nodeModulesPath = join(rootDir, 'node_modules');
  try {
    rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('✓ Removed node_modules/');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`⚠ Warning: Could not remove node_modules/: ${error.message}`);
    }
  }
} else {
  console.log('Cleaning generated files...\n');
  cleanFolders();
  cleanFiles();
}

console.log('\n✓ Cleanup complete!');

