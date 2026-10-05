#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load AIUL data
const dataFilePath = path.join(__dirname, '..', '_data', 'aiul.yml');
const aiulData = yaml.load(fs.readFileSync(dataFilePath, 'utf8'));

// Base URL for GitHub Pages
const baseUrl = 'https://dmd-program.github.io/aiul';

// CDN URL for static assets (images)
const cdnUrl = 'https://cdn.jsdelivr.net/gh/dmd-program/aiul@main';

// Front matter and body of a Jekyll page ("---\nyaml\n---\nbody")
function readPage(file) {
  if (!fs.existsSync(file)) return { data: {}, body: '' };
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return match ? { data: yaml.load(match[1]) || {}, body: match[2] } : { data: {}, body: text };
}

// The bullet points under a "## Heading" in a page body, as plain text
function bulletsUnder(body, heading) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line)) break;
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) out.push(item[1].replace(/\*\*|__/g, '').trim());
  }
  return out;
}

// What a license means, from its page (_licenses/aiul-<id>.md) and the
// versioned page its URL points to (_aiul/licenses/<id>/<version>/index.md)
function licenseDetails(key, version) {
  const page = readPage(path.join(__dirname, '..', '_licenses', `aiul-${key}.md`));
  const versioned = readPage(path.join(__dirname, '..', '_aiul', 'licenses', key, version, 'index.md'));
  const students = bulletsUnder(versioned.body, 'Guidelines for Students');
  return {
    description: page.data.description || '',
    syllabusText: page.data.syllabus_text || '',
    whenToUse: page.data.when_to_use || [],
    requirements: page.data.requirements || [],
    studentGuidelines: students.length ? students : bulletsUnder(page.body, 'Guidelines for Students')
  };
}

// What a modifier covers, from its page (_modifiers/<id>.md)
function modifierDetails(key) {
  const page = readPage(path.join(__dirname, '..', '_modifiers', `${key}.md`));
  return {
    description: page.data.description || '',
    examples: page.data.example || ''
  };
}

// Generate API data
function generateAPI() {
  const api = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    baseUrl: baseUrl,
    cdnUrl: cdnUrl,
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
      image: `${cdnUrl}/assets/images/licenses/aiul-${key}.png`,
      released: license.versions[version].released,
      ...licenseDetails(key, version)
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
      released: modifier.versions[version].released,
      ...modifierDetails(key)
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
        image: `${cdnUrl}/assets/images/licenses/aiul-${combinationKey}.png`
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
