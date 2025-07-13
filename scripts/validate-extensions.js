#!/usr/bin/env node

/**
 * Extension Validation Script
 * Teaches the agent about proper extension structure
 */

import fs from 'fs'
import path from 'path'

const EXTENSIONS_DIR = './src'

function validateExtension(extensionName) {
  const extensionPath = path.join(EXTENSIONS_DIR, extensionName)
  
  console.log(`\n🔍 Validating ${extensionName}...`)
  
  // Required files
  const requiredFiles = [
    'package.json',
    'manifest.json', 
    'vite.config.js',
    'src/main-component.vue',
    'src/extension-name.ts',
    'src/lib/mount-manager.ts',
    'src/assets/main.css'
  ]
  
  const issues = []
  
  // Check if extension directory exists
  if (!fs.existsSync(extensionPath)) {
    issues.push(`❌ Extension directory doesn't exist`)
    return issues
  }
  
  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(extensionPath, file.replace('main-component.vue', `${extensionName}.vue`).replace('extension-name.ts', `${extensionName}.ts`))
    if (!fs.existsSync(filePath)) {
      issues.push(`❌ Missing required file: ${file}`)
    }
  }
  
  // Check package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8'))
    if (!packageJson.scripts?.build) {
      issues.push(`❌ Missing build script in package.json`)
    }
  } catch (e) {
    issues.push(`❌ Invalid package.json`)
  }
  
  // Check manifest.json
  try {
    const manifestJson = JSON.parse(fs.readFileSync(path.join(extensionPath, 'manifest.json'), 'utf8'))
    if (!manifestJson.entrypoints?.includes(extensionName)) {
      issues.push(`❌ Manifest entrypoints should include '${extensionName}'`)
    }
  } catch (e) {
    issues.push(`❌ Invalid manifest.json`)
  }
  
  if (issues.length === 0) {
    console.log(`✅ ${extensionName} is valid`)
  } else {
    console.log(`❌ ${extensionName} has issues:`)
    issues.forEach(issue => console.log(`  ${issue}`))
  }
  
  return issues
}

// Get all extensions
const extensions = fs.readdirSync(EXTENSIONS_DIR)
  .filter(item => fs.statSync(path.join(EXTENSIONS_DIR, item)).isDirectory())
  .filter(item => fs.existsSync(path.join(EXTENSIONS_DIR, item, 'package.json')))

console.log(`\n📦 Found ${extensions.length} extensions: ${extensions.join(', ')}`)

const allIssues = []
for (const extension of extensions) {
  const issues = validateExtension(extension)
  allIssues.push(...issues)
}

if (allIssues.length === 0) {
  console.log('\n🎉 All extensions are valid!')
} else {
  console.log(`\n⚠️  Found ${allIssues.length} issues across all extensions`)
  process.exit(1)
} 