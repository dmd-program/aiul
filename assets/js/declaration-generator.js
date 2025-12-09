document.addEventListener('DOMContentLoaded', function() {
    // State
    let entries = [];
    let currentFormat = 'html';

    // DOM Elements
    const modifierSelect = document.getElementById('modifierType');
    const usageSelect = document.getElementById('usageLevel');
    const usageDescription = document.getElementById('usageDescription');
    const toolInput = document.getElementById('toolUsed');
    const notesInput = document.getElementById('usageNotes');
    const addEntryBtn = document.getElementById('addEntryBtn');
    const entriesList = document.getElementById('entriesList');
    const previewSection = document.getElementById('previewSection');
    const previewBox = document.getElementById('declarationPreview');
    const codeOutput = document.getElementById('codeOutput');
    const copyBtn = document.getElementById('copyCode');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const downloadPNG = document.getElementById('downloadPNG');
    const downloadSVG = document.getElementById('downloadSVG');
    const embedCodeSection = document.getElementById('embedCodeSection');
    const embedCodeDisplay = document.getElementById('embedCode');
    const copyEmbedCodeButton = document.getElementById('copyEmbedCode');

    // Data
    const usageData = window.usageLevels.reduce((acc, level) => {
        acc[level.id] = level;
        return acc;
    }, {});

    // Event Listeners
    usageSelect.addEventListener('change', function() {
        const level = usageData[this.value];
        usageDescription.textContent = level ? level.description : '';
        checkFormValidity();
    });

    modifierSelect.addEventListener('change', checkFormValidity);

    addEntryBtn.addEventListener('click', addEntry);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFormat = this.dataset.tab;
            updateCodeOutput();
        });
    });

    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(codeOutput.textContent).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
        });
    });

    copyEmbedCodeButton.addEventListener('click', function() {
        navigator.clipboard.writeText(embedCodeDisplay.textContent).then(() => {
            const originalText = copyEmbedCodeButton.textContent;
            copyEmbedCodeButton.textContent = 'Copied!';
            setTimeout(() => { copyEmbedCodeButton.textContent = originalText; }, 2000);
        });
    });

    downloadPNG.addEventListener('click', downloadAsPNG);
    downloadSVG.addEventListener('click', downloadAsSVG);

    // Functions
    function checkFormValidity() {
        addEntryBtn.disabled = !(modifierSelect.value && usageSelect.value);
    }

    function addEntry() {
        const entry = {
            id: Date.now(),
            modifier: modifierSelect.value,
            usageId: usageSelect.value,
            usageName: usageData[usageSelect.value].name,
            usageIcon: usageData[usageSelect.value].icon,
            tools: toolInput.value,
            notes: notesInput.value
        };

        entries.push(entry);
        
        // Reset form
        modifierSelect.value = '';
        usageSelect.value = '';
        toolInput.value = '';
        notesInput.value = '';
        usageDescription.textContent = '';
        checkFormValidity();

        renderEntriesList();
        updateCodeOutput();
        updateEmbedCode();
        
        embedCodeSection.style.display = 'block';
        
        // Auto-generate graphic
        renderGraphic();
    }

    function removeEntry(id) {
        entries = entries.filter(e => e.id !== id);
        renderEntriesList();
        updateCodeOutput();
        updateEmbedCode();

        if (entries.length === 0) {
            embedCodeSection.style.display = 'none';
        }
        
        // Auto-update graphic (handles empty state internally)
        renderGraphic();
    }

    function moveEntry(id, direction) {
        const index = entries.findIndex(e => e.id === id);
        if (index < 0) return;
        
        if (direction === 'up' && index > 0) {
            [entries[index], entries[index-1]] = [entries[index-1], entries[index]];
        } else if (direction === 'down' && index < entries.length - 1) {
            [entries[index], entries[index+1]] = [entries[index+1], entries[index]];
        }
        
        renderEntriesList();
        updateCodeOutput();
        updateEmbedCode();
        
        // Auto-update graphic
        renderGraphic();
    }

    function renderEntriesList() {
        entriesList.innerHTML = '';
        if (entries.length === 0) {
            entriesList.innerHTML = '<div class="empty-state">No entries added yet.</div>';
            return;
        }

        entries.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'entry-item';
            div.innerHTML = `
                <div class="entry-info">
                    <strong>${entry.modifier}</strong> - ${entry.usageName}
                </div>
                <div class="entry-controls">
                    <button class="icon-btn" onclick="window.moveEntry(${entry.id}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="icon-btn" onclick="window.moveEntry(${entry.id}, 'down')" ${index === entries.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="icon-btn delete" onclick="window.removeEntry(${entry.id})">×</button>
                </div>
            `;
            entriesList.appendChild(div);
        });
    }

    // Expose functions to window for onclick handlers
    window.removeEntry = removeEntry;
    window.moveEntry = moveEntry;

    function updateCodeOutput() {
        if (entries.length === 0) {
            codeOutput.textContent = '';
            return;
        }

        let output = '';
        if (currentFormat === 'html') {
            output = `<!-- AI Usage Declaration -->\n<div class="aiul-declaration">\n  <h3>AI Usage Declaration</h3>\n  <ul style="list-style: none; padding: 0;">\n`;
            entries.forEach(e => {
                output += `    <li style="margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="background: #000; color: #fff; padding: 2px 8px; font-weight: bold;">${e.modifier}</span>
        <span>→</span>
        <strong>${e.usageName}</strong>
      </div>
      ${e.tools ? `<div style="font-size: 0.9em;">Tools: ${e.tools}</div>` : ''}
      ${e.notes ? `<div style="font-size: 0.9em; color: #555;">${e.notes}</div>` : ''}
    </li>\n`;
            });
            output += `  </ul>\n</div>`;
        } else if (currentFormat === 'markdown') {
            output = `### AI Usage Declaration\n\n`;
            entries.forEach(e => {
                output += `*   **${e.modifier}** → **${e.usageName}**\n`;
                if (e.tools) output += `    *   Tools: ${e.tools}\n`;
                if (e.notes) output += `    *   Notes: ${e.notes}\n`;
            });
        } else {
            output = `AI USAGE DECLARATION\n====================\n\n`;
            entries.forEach(e => {
                output += `${e.modifier} -> ${e.usageName}\n`;
                if (e.tools) output += `  Tools: ${e.tools}\n`;
                if (e.notes) output += `  Notes: ${e.notes}\n`;
                output += `\n`;
            });
        }
        codeOutput.textContent = output;
    }

    function updateEmbedCode() {
        let html = `<div style="border: 2px solid #000; padding: 20px; font-family: sans-serif; max-width: 500px; background: #fff;">
  <div style="font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">AI USAGE DECLARATION</div>`;
        
        entries.forEach(e => {
            html += `
  <div style="margin-bottom: 15px;">
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="background: #000; color: #fff; padding: 4px 8px; font-weight: bold; margin-right: 10px;">${e.modifier}</span>
      <span style="margin-right: 10px;">→</span>
      <span style="font-weight: bold;">${e.usageName}</span>
    </div>
    ${e.tools || e.notes ? `<div style="font-size: 14px; color: #333;">${e.tools ? 'Tools: ' + e.tools : ''}${e.tools && e.notes ? ' | ' : ''}${e.notes || ''}</div>` : ''}
  </div>`;
        });
        
        html += `</div>`;
        embedCodeDisplay.textContent = html;
    }

    function renderGraphic() {
        if (entries.length === 0) {
            previewBox.innerHTML = `
                <div class="placeholder-text" style="color: #999; font-style: italic;">
                  Add entries to generate your declaration graphic.
                </div>`;
            return;
        }
        const svgContent = createSVG();
        previewBox.innerHTML = svgContent;
    }

    function createSVG() {
        const width = 600;
        const headerHeight = 60;
        const padding = 20;
        const baseRowSpacing = 45; // Base height for a row with no details
        const detailSpacing = 20;  // Extra height per detail line
        
        // Calculate total height
        let totalHeight = headerHeight + 30; // Initial Y offset
        entries.forEach(e => {
            let entryHeight = baseRowSpacing;
            if (e.tools) entryHeight += detailSpacing;
            if (e.notes) entryHeight += detailSpacing;
            totalHeight += entryHeight;
        });
        
        // Add a bit of bottom padding
        totalHeight += padding;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <defs>
    <style>
      .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif; font-weight: 700; font-size: 24px; letter-spacing: 1px; }
      .mod-bg { fill: black; }
      .mod-text { fill: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif; font-weight: 700; font-size: 14px; text-transform: uppercase; }
      .arrow { fill: black; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif; font-size: 20px; font-weight: 700; }
      .usage { fill: black; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif; font-weight: 700; font-size: 18px; }
      .details { fill: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif; font-size: 14px; font-weight: 400; }
      .details-label { font-weight: 700; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
  <rect x="2" y="2" width="${width-4}" height="${totalHeight-4}" fill="none" stroke="black" stroke-width="4"/>
  
  <text x="${padding}" y="40" class="header">AI USAGE DECLARATION</text>
  <line x1="${padding}" y1="55" x2="${width-padding}" y2="55" stroke="black" stroke-width="2"/>
`;

        let y = 90;
        entries.forEach(e => {
            // Modifier Badge
            const modWidth = (e.modifier.length * 9) + 24;
            
            svg += `<rect x="${padding}" y="${y-18}" width="${modWidth}" height="26" class="mod-bg"/>`;
            svg += `<text x="${padding + 12}" y="${y}" class="mod-text">${e.modifier}</text>`;
            
            // Arrow
            svg += `<text x="${padding + modWidth + 10}" y="${y}" class="arrow">→</text>`;
            
            // Usage Icon & Name
            const iconPath = getIconPath(e.usageIcon);
            const iconX = padding + modWidth + 35;
            const iconY = y - 14;
            
            svg += `<g transform="translate(${iconX}, ${iconY}) scale(0.8)">
                ${iconPath}
            </g>`;
            
            svg += `<text x="${iconX + 24}" y="${y}" class="usage">${e.usageName}</text>`;
            
            // Details
            let currentEntryHeight = baseRowSpacing;
            
            if (e.tools || e.notes) {
                let detailY = y + 25;
                
                if (e.tools) {
                    let toolsText = e.tools;
                    if (toolsText.length > 65) toolsText = toolsText.substring(0, 62) + '...';
                    svg += `<text x="${padding}" y="${detailY}" class="details"><tspan class="details-label">Tools:</tspan> ${escapeXml(toolsText)}</text>`;
                    detailY += 20;
                    currentEntryHeight += detailSpacing;
                }
                
                if (e.notes) {
                    let noteText = e.notes;
                    if (noteText.length > 75) noteText = noteText.substring(0, 72) + '...';
                    svg += `<text x="${padding}" y="${detailY}" class="details">${escapeXml(noteText)}</text>`;
                    currentEntryHeight += detailSpacing;
                }
            }
            
            y += currentEntryHeight;
        });

        svg += `</svg>`;
        return svg;
    }

    function downloadAsPNG() {
        try {
            const svgContent = createSVG();
            
            // Create canvas and render SVG using canvas 2D context
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Parse SVG dimensions
            const svgMatch = svgContent.match(/width="(\d+)"\s+height="(\d+)"/);
            const svgWidth = parseInt(svgMatch[1]) || 600;
            const svgHeight = parseInt(svgMatch[2]) || 400;
            
            const scale = 4; // High resolution
            canvas.width = svgWidth * scale;
            canvas.height = svgHeight * scale;
            
            // Create an SVG element and render it to canvas
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                
                // Download
                canvas.toBlob(function(blob) {
                    const downloadUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = 'ai-usage-declaration.png';
                    link.href = downloadUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(downloadUrl);
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            
            img.onerror = function() {
                console.error('Failed to load SVG image');
                alert('Error generating PNG. Please try downloading SVG instead.');
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
            
        } catch (error) {
            console.error('Error generating PNG:', error);
            alert('Error generating PNG: ' + error.message);
        }
    }

    function downloadAsSVG() {
        const svgContent = createSVG();
        // Add XML declaration for better compatibility
        const svgWithDeclaration = `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent}`;
        const blob = new Blob([svgWithDeclaration], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'ai-usage-declaration.svg';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    function getIconPath(iconName) {
        // Returns just the path/shape content for embedding in SVG
        const icons = {
            'lightbulb': '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
            'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
            'robot': '<rect x="3" y="11" width="18" height="10" rx="2" fill="none" stroke="black" stroke-width="2"/><circle cx="12" cy="5" r="2" fill="none" stroke="black" stroke-width="2"/><path d="M12 7v4" stroke="black" stroke-width="2"/><line x1="8" y1="16" x2="8" y2="16" stroke="black" stroke-width="2"/><line x1="16" y1="16" x2="16" y2="16" stroke="black" stroke-width="2"/>',
            'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        };
        return icons[iconName] || '';
    }
    
    // Helper for HTML preview (still used for icon selection if needed, but we use SVG for main preview now)
    function getIconSvg(iconName) {
        // ... (keep existing implementation if needed for other parts, or remove if unused)
        // For now, we don't use this in the new renderGraphic flow
        return ''; 
    }
});
