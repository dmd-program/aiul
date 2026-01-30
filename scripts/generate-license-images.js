#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { JSDOM } = require('jsdom');

// Register local fonts
const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
registerFont(path.join(fontsDir, 'Kanit-Regular.ttf'), { family: 'Kanit', weight: 'normal' });
registerFont(path.join(fontsDir, 'Kanit-Bold.ttf'), { family: 'Kanit', weight: 'bold' });

// Create a virtual DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="tagPreview">
    <div id="tagContainer" class="tag-size-medium">
      <div class="tag-main">
        <span class="tag-text">AIUL-NA</span>
      </div>
      <div class="tag-modifier" style="display:none">
        <span class="modifier-text"></span>
      </div>
    </div>
  </div>
</body></html>`, {
  url: "https://dmd-program.github.io/aiul/",
  resources: "usable",
  runScripts: "dangerously"
});

// Make virtual DOM elements accessible
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock necessary DOM elements
class MockElement {
  constructor() {
    this.textContent = '';
    this.className = '';
    this.style = {};
  }
}

const downloadMessage = new MockElement();

// Read license and modifier types from the JSON data file
let licenseTypes = ['NA', 'WA', 'CD', 'TC', 'DP', 'IU']; // Default fallback values
let modifierTypes = ['WR', 'IM', 'VD', 'AU', '3D', 'TR', 'MX', 'CO']; // Default fallback values

// Try to load from the JSON file (which will be generated during Jekyll build)
try {
  const dataFilePath = path.join(__dirname, '..', '_site', 'license-data.json');
  if (fs.existsSync(dataFilePath)) {
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath));
    if (jsonData.licenses && Array.isArray(jsonData.licenses) && jsonData.licenses.length > 0) {
      licenseTypes = jsonData.licenses;
      console.log('Loaded license types from JSON:', licenseTypes);
    }
    if (jsonData.modifiers && Array.isArray(jsonData.modifiers) && jsonData.modifiers.length > 0) {
      modifierTypes = jsonData.modifiers;
      console.log('Loaded modifier types from JSON:', modifierTypes);
    }
  } else {
    console.warn('Warning: license-data.json not found. Using default hardcoded values.');
  }
} catch (err) {
  console.error('Error loading license data from JSON:', err);
  console.warn('Using default hardcoded values instead.');
}

// Output directory setup
const outputDir = path.join(__dirname, '..', 'assets', 'images', 'licenses');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Import the core functions from tag-generator.js
// Note: These are copied from your tag-generator.js file to ensure consistency

function createSVG(licenseCode, modifierCode = null, forPNG = false) {
  // Define font sizes and border widths based on medium tag size
  const fontSize = 32;
  const fontSizeModifier = 24;
  const borderWidth = 8;
  const padding = 12;
  
  // Get text content
  const mainText = `AIUL-${licenseCode}`;
  
  // Calculate main tag width based on approximate character width
  const charWidth = fontSize * 0.6;
  const mainTextWidth = mainText.length * charWidth;
  const tagWidth = mainTextWidth + (padding * 2);
  const tagHeight = fontSize + (padding * 2);
  
  // Start SVG with proper dimensions
  let totalWidth = tagWidth;
  let totalHeight = tagHeight;
  
  // Calculate modifier dimensions if needed
  let modifierWidth = 0;
  let modifierText = '';
  
  if (modifierCode) {
    modifierText = modifierCode;
    modifierWidth = modifierText.length * charWidth + (padding * 2);
    totalWidth += modifierWidth;
  }
  
  // Create SVG with embedded styles
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
  
  // Add embedded font styling (fonts are registered with canvas)
  svg += `<defs>
      <style>
          .tag-text { 
              font-family: 'Kanit', sans-serif;
              font-weight: 700;
              font-size: ${fontSize}px;
          }
          .modifier-text { 
              font-family: 'Kanit', sans-serif;
              font-weight: 400;
              font-size: ${fontSizeModifier}px;
              fill: white;
          }
      </style>
  </defs>`;
  
  // For direct SVG download (not for PNG conversion), use regular border width
  // For PNG conversion, use thicker border if specified
  const actualBorderWidth = forPNG ? borderWidth * 2 : borderWidth;
  // Store half the stroke width for positioning the modifier text
  const halfStroke = actualBorderWidth / 2;
  
  // Main tag rectangle
  svg += `<rect x="0" y="0" width="${tagWidth}" height="${tagHeight}" 
          fill="white" stroke="black" stroke-width="${actualBorderWidth}" />`;
  
  // For Illustrator compatibility, add the text inside a group with alignment
  svg += `<g>
      <!-- Main tag text in the center -->
      <text x="${tagWidth / 2}" y="${tagHeight / 2 + fontSize/3}" 
          class="tag-text" text-anchor="middle">${mainText}</text>
  </g>`;
  
  // Add modifier if needed
  if (modifierCode) {
    const modifierX = tagWidth;
    
    // Modifier rectangle - with stroke matching the main box
    svg += `<rect x="${modifierX}" y="0" width="${modifierWidth}" height="${tagHeight}" 
            fill="black" stroke="black" stroke-width="${actualBorderWidth}" />`;
    
    // Modifier text - also in a group with alignment
    // Modified to move text left by half the main tag stroke width
    svg += `<g>
        <text x="${modifierX + (modifierWidth / 2) - (borderWidth / 2)}" y="${tagHeight / 2 + fontSizeModifier/3}" 
            class="modifier-text" text-anchor="middle">${modifierText}</text>
    </g>`;
  }
  
  svg += '</svg>';
  return svg;
}

// Generate PNG directly by drawing on canvas (no SVG intermediate)
async function generatePNGDirectly(licenseCode, modifierCode, outputPath) {
  try {
    // Configuration matching the SVG design
    const fontSize = 32;
    const fontSizeModifier = 24;
    const borderWidth = 8;
    const padding = 12;
    const scale = 2; // Higher resolution
    
    // Calculate dimensions
    const mainText = `AIUL-${licenseCode}`;
    const charWidth = fontSize * 0.6;
    const mainTextWidth = mainText.length * charWidth;
    const tagWidth = mainTextWidth + (padding * 2);
    const tagHeight = fontSize + (padding * 2);
    
    let modifierWidth = 0;
    let totalWidth = tagWidth;
    let modifierText = '';
    
    if (modifierCode) {
      modifierText = modifierCode;
      modifierWidth = modifierText.length * charWidth + (padding * 2);
      totalWidth += modifierWidth;
    }
    
    // Create high-resolution canvas
    const canvas = createCanvas(totalWidth * scale, tagHeight * scale);
    const ctx = canvas.getContext('2d');
    
    // Scale for high resolution
    ctx.scale(scale, scale);
    
    // Enable antialiasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw main tag background (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tagWidth, tagHeight);
    
    // Draw main tag border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, tagWidth - borderWidth, tagHeight - borderWidth);
    
    // Draw main tag text with Kanit Bold
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${fontSize}px Kanit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainText, tagWidth / 2, tagHeight / 2);
    
    // Draw modifier if present
    if (modifierCode) {
      const modifierX = tagWidth;
      
      // Draw modifier background (black)
      ctx.fillStyle = '#000000';
      ctx.fillRect(modifierX, 0, modifierWidth, tagHeight);
      
      // Draw modifier border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(modifierX + borderWidth / 2, borderWidth / 2, modifierWidth - borderWidth, tagHeight - borderWidth);
      
      // Draw modifier text with Kanit Regular
      ctx.fillStyle = '#ffffff';
      ctx.font = `${fontSizeModifier}px Kanit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(modifierText, modifierX + modifierWidth / 2, tagHeight / 2);
    }
    
    // Write to PNG
    const buffer = canvas.toBuffer('image/png', {
      compressionLevel: 6,
      filters: canvas.PNG_ALL_FILTERS
    });
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PNG:', error);
  }
}

async function generatePNGFromSVG(svgContent, outputPath) {
    try {
      // DEPRECATED: This function is no longer used
      // We now draw directly on canvas to ensure proper font rendering
      // Parse the SVG to modify its dimensions
      let biggerSvgContent = svgContent;
      
      // Extract current dimensions
      const widthMatch = svgContent.match(/width="([^"]+)"/);
      const heightMatch = svgContent.match(/height="([^"]+)"/);
      const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
      
      if (widthMatch && heightMatch) {
        const originalWidth = parseFloat(widthMatch[1]);
        const originalHeight = parseFloat(heightMatch[1]);
        
        // Scale factor for the SVG itself - make it much larger
        const svgScale = 1;
        const newWidth = originalWidth * svgScale;
        const newHeight = originalHeight * svgScale;
        
        // Replace dimensions in SVG
        biggerSvgContent = svgContent
          .replace(/width="([^"]+)"/, `width="${newWidth}"`)
          .replace(/height="([^"]+)"/, `height="${newHeight}"`);
        
        // Keep the viewBox the same to maintain proportions
        if (!viewBoxMatch) {
          // If no viewBox exists, add one to maintain scaling
          biggerSvgContent = biggerSvgContent.replace('<svg ', 
            `<svg viewBox="0 0 ${originalWidth} ${originalHeight}" `);
        }
      }
      
      // Write the larger SVG to a temporary file
      const tempSvgPath = path.join(__dirname, 'temp.svg');
      fs.writeFileSync(tempSvgPath, biggerSvgContent);
      
      // Load the larger SVG
      const img = await loadImage(tempSvgPath);
      
      // Additional scale factor for PNG conversion
      const pngScale = 1;
      
      // Create an even larger canvas
      const canvas = createCanvas(img.width * pngScale, img.height * pngScale);
      const ctx = canvas.getContext('2d');
      
      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Write canvas to PNG file with high quality
      const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 0,  // No compression for better quality
        filters: canvas.PNG_ALL_FILTERS
      });
      fs.writeFileSync(outputPath, buffer);
      
      // Clean up temporary file
      fs.unlinkSync(tempSvgPath);
      
      console.log(`Generated: ${outputPath}`);
    } catch (error) {
      console.error('Error generating PNG:', error);
    }
  }

// Main function to generate all license images
async function generateAllLicenseImages() {
  console.log('Generating license images...');
  
  // Generate base license images
  for (const license of licenseTypes) {
    // Handle both string and object formats for license codes
    const licenseCode = typeof license === 'string' ? license : license.code;
    
    const outputPath = path.join(outputDir, `aiul-${licenseCode.toLowerCase()}.png`);
    await generatePNGDirectly(licenseCode, null, outputPath);
    
    // Generate license + modifier combinations
    for (const modifier of modifierTypes) {
      // Handle both string and object formats for modifier codes
      const modifierCode = typeof modifier === 'string' ? modifier : modifier.code;
      
      const modOutputPath = path.join(outputDir, `aiul-${licenseCode.toLowerCase()}-${modifierCode.toLowerCase()}.png`);
      await generatePNGDirectly(licenseCode, modifierCode, modOutputPath);
    }
  }
  
  console.log('License image generation complete!');
}

// Run the generator
generateAllLicenseImages().catch(err => {
  console.error('Error generating license images:', err);
  process.exit(1);
});