/**
 * Build Windows Distribution for Open Source Edition
 * 
 * Simple script to package the app for Windows.
 * Prerequisites: Node.js installed on target machine.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist-win');
const PKG_NAME = 'AeonSage-OpenSource-Win';

console.log('📦 Building Windows Distribution...');

// 1. Clean
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);

// 2. Create Loader (Batch file for easy launch)
const batContent = `@echo off
title AeonSage Open Source
echo Starting AeonSage OS...
node "%~dp0\\dist\\entry.js" %*
if %errorlevel% neq 0 pause
`;

fs.writeFileSync(path.join(DIST_DIR, 'aeonsage.bat'), batContent);
console.log('✅ Created launcher: aeonsage.bat');

// 3. Instruction
const readme = `# AeonSage Open Source - Windows Portable

## How to Run
1. Ensure Node.js (v20+) is installed.
2. Double-click "aeonsage.bat" to launch.

## CLI Usage
Open cmd.exe in this folder and run:
  aeonsage.bat --help
`;
fs.writeFileSync(path.join(DIST_DIR, 'README_WIN.txt'), readme);

console.log('✅ Created README_WIN.txt');

// 4. Instructions to copy files
console.log('👉 To finish packaging:');
console.log('   1. Copy "dist/" folder to "' + DIST_DIR + '\\dist"');
console.log('   2. Copy "node_modules/" (production only) to "' + DIST_DIR + '\\node_modules"');
console.log('   3. Zip the content of "' + DIST_DIR + '" as AeonSage-Win-OSS.zip');
