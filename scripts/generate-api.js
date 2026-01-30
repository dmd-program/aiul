#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load AIUL data
const dataFilePath = path.join(__dirname, '..', '_data', 'aiul.yml');
const aiulData = yaml.load(fs.readFileSync(dataFilePath, 'utf8'));

// Base URL for GitHub Pages
const baseUrl = 'https://dmd-program.github.io/aiul';

// Generate API data
function generateAPI() {
  const api = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    baseUrl: baseUrl,
    documentation: `${baseUrl}/guide.html`,
    
    licenses: [],
    modifiers: [],
    combinations: [],
    usageLevels: []
  };

  // Process licenses
  for (const [key, license] of Object.entries(aiulData.licenses.items)) {
    const licenseCode = key.toUpperCase();
    const version = license.latest;
    const versionUrl = license.versions[version].url;
    // URLs in YAML already include /aiul/, so just prepend the domain
    const fullUrl = versionUrl.startsWith('http') ? versionUrl : `${baseUrl.replace('/aiul', '')}${versionUrl}`;
    
    api.licenses.push({
      id: key,
      code: licenseCode,
      title: license.title,
      fullName: license.full_name,
      version: version,
      url: fullUrl,
      image: `${baseUrl}/assets/images/licenses/aiul-${key}.png`,
      released: license.versions[version].released
    });
  }

  // Process modifiers
  for (const [key, modifier] of Object.entries(aiulData.modifiers.items)) {
    const version = modifier.latest;
    const versionUrl = modifier.versions[version].url;
    const fullUrl = versionUrl.startsWith('http') ? versionUrl : `${baseUrl.replace('/aiul', '')}${versionUrl}`;
    
    api.modifiers.push({
      id: key,
      code: modifier.code,
      title: modifier.title,
      fullName: modifier.full_name,
      version: version,
      url: fullUrl,
      released: modifier.versions[version].released
    });
  }

  // Process usage levels
  for (const [key, level] of Object.entries(aiulData.usage_levels.items)) {
    const version = level.latest;
    const versionUrl = level.versions[version].url;
    const fullUrl = versionUrl.startsWith('http') ? versionUrl : `${baseUrl.replace('/aiul', '')}${versionUrl}`;
    
    api.usageLevels.push({
      id: key,
      name: level.name,
      icon: level.icon,
      version: version,
      url: fullUrl,
      released: level.versions[version].released
    });
  }

  // Generate all license + modifier combinations
  for (const license of api.licenses) {
    for (const modifier of api.modifiers) {
      const combinationCode = `${license.code}-${modifier.code}`;
      const combinationKey = `${license.id}-${modifier.code.toLowerCase()}`;
      
      api.combinations.push({
        id: combinationKey,
        code: combinationCode,
        license: {
          id: license.id,
          code: license.code,
          title: license.title
        },
        modifier: {
          id: modifier.id,
          code: modifier.code,
          title: modifier.title
        },
        url: `${baseUrl}/combinations/${combinationKey}.html`,
        image: `${baseUrl}/assets/images/licenses/aiul-${combinationKey}.png`
      });
    }
  }

  return api;
}

// Write API file
function writeAPIFile() {
  const api = generateAPI();
  const outputDir = path.join(__dirname, '..', 'api');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write main API file
  const outputPath = path.join(outputDir, 'v1.json');
  fs.writeFileSync(outputPath, JSON.stringify(api, null, 2));
  console.log(`Generated API file: ${outputPath}`);

  // Write individual resource files for easier access
  const licensesPath = path.join(outputDir, 'licenses.json');
  fs.writeFileSync(licensesPath, JSON.stringify({
    version: '1.0.0',
    generated: api.generated,
    data: api.licenses
  }, null, 2));
  console.log(`Generated licenses API: ${licensesPath}`);

  const modifiersPath = path.join(outputDir, 'modifiers.json');
  fs.writeFileSync(modifiersPath, JSON.stringify({
    version: '1.0.0',
    generated: api.generated,
    data: api.modifiers
  }, null, 2));
  console.log(`Generated modifiers API: ${modifiersPath}`);

  const combinationsPath = path.join(outputDir, 'combinations.json');
  fs.writeFileSync(combinationsPath, JSON.stringify({
    version: '1.0.0',
    generated: api.generated,
    data: api.combinations
  }, null, 2));
  console.log(`Generated combinations API: ${combinationsPath}`);

  console.log('\nAPI generation complete!');
  console.log(`\nAPI Endpoints:`);
  console.log(`  Main API: ${api.baseUrl}/api/v1.json`);
  console.log(`  Licenses: ${api.baseUrl}/api/licenses.json`);
  console.log(`  Modifiers: ${api.baseUrl}/api/modifiers.json`);
  console.log(`  Combinations: ${api.baseUrl}/api/combinations.json`);
}

// Run the generator
try {
  writeAPIFile();
} catch (err) {
  console.error('Error generating API:', err);
  process.exit(1);
}
