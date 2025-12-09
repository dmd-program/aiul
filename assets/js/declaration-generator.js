document.addEventListener('DOMContentLoaded', function() {
    // State
    let entries = [];

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
    const downloadPNG = document.getElementById('downloadPNG');
    const downloadSVG = document.getElementById('downloadSVG');
    const htmlPreviewSection = document.getElementById('htmlPreviewSection');
    const embedPreview = document.getElementById('embedPreview');
    const embedCodeDisplay = document.getElementById('embedCodeDisplay');
    const copyEmbedCodeBtn = document.getElementById('copyEmbedCodeBtn');

    // Data
    const usageData = window.usageLevels.reduce((acc, level) => {
        acc[level.id] = level;
        return acc;
    }, {});

    // Map usage level IDs to AIUL URLs
    const usageLevelUrls = {
        'ideation': '/aiul/usage-levels/ideation/',
        'assistance': '/aiul/usage-levels/assistance/',
        'generation': '/aiul/usage-levels/generation/',
        'refinement': '/aiul/usage-levels/refinement/'
    };

    // Get modifier URLs from the injected window data (auto-populated from Jekyll)
    const aiulModifierUrls = window.aiulModifierUrls || {};
    
    // Create a mapping of full names to short codes for display
    const modifierNameToCode = {
        '3D': '3D',
        'Audio': 'AU',
        'Code': 'CO',
        'Image': 'IM',
        'Mixed Media': 'MX',
        'Traditional Media': 'TR',
        'Video': 'VD',
        'Writing': 'WR'
    };
    
    // Helper function to get modifier short code from full name
    function getModifierCode(fullName) {
        return modifierNameToCode[fullName] || fullName.substring(0, 2).toUpperCase();
    }

    // Load saved declaration entries from localStorage
    function loadSavedDeclaration() {
        const savedEntries = localStorage.getItem('AIULDeclarationEntries');
        if (savedEntries) {
            try {
                entries = JSON.parse(savedEntries);
                console.log('Loaded saved declaration entries:', entries);
                renderEntriesList();
                updateEmbedCode();
                if (entries.length > 0) {
                    htmlPreviewSection.style.display = 'block';
                }
                renderGraphic();
            } catch (error) {
                console.error('Error loading saved declaration:', error);
            }
        }
    }

    // Save declaration entries to localStorage
    function saveDeclaration() {
        localStorage.setItem('AIULDeclarationEntries', JSON.stringify(entries));
        console.log('Declaration saved to localStorage');
    }

    // Load saved declaration on page load
    loadSavedDeclaration();

    // Event Listeners
    usageSelect.addEventListener('change', function() {
        const level = usageData[this.value];
        usageDescription.textContent = level ? level.description : '';
        checkFormValidity();
    });

    modifierSelect.addEventListener('change', checkFormValidity);

    addEntryBtn.addEventListener('click', addEntry);

    copyEmbedCodeBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(embedCodeDisplay.textContent).then(() => {
            const originalText = copyEmbedCodeBtn.textContent;
            copyEmbedCodeBtn.textContent = 'Copied!';
            setTimeout(() => { copyEmbedCodeBtn.textContent = originalText; }, 2000);
        });
    });

    downloadPNG.addEventListener('click', downloadAsPNG);
    downloadSVG.addEventListener('click', downloadAsSVG);

    // Accessibility: Character count announcements
    notesInput.addEventListener('input', function() {
        const countElement = document.getElementById('notesCount');
        const remaining = 75 - this.value.length;
        countElement.textContent = `${this.value.length} / 75 characters`;
        if (remaining <= 10 && remaining > 0) {
            countElement.textContent += ` (${remaining} remaining)`;
        } else if (remaining === 0) {
            countElement.textContent += ' (limit reached)';
        }
    });

    // Functions
    function checkFormValidity() {
        const isValid = modifierSelect.value && usageSelect.value;
        addEntryBtn.disabled = !isValid;
        addEntryBtn.setAttribute('aria-disabled', !isValid);
    }

    function addEntry() {
        const entry = {
            id: Date.now(),
            modifier: modifierSelect.value,  // Now this will be the full name (e.g., "Image")
            modifierUrl: window.aiulModifierUrls ? window.aiulModifierUrls[modifierSelect.value] : null,
            usageId: usageSelect.value,
            usageName: usageData[usageSelect.value].name,
            usageIcon: usageData[usageSelect.value].icon,
            usageUrl: usageLevelUrls[usageSelect.value] || null,
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
        updateEmbedCode();
        saveDeclaration();
        
        
        // Auto-generate graphic
        renderGraphic();
    }

    function removeEntry(id) {
        entries = entries.filter(e => e.id !== id);
        renderEntriesList();
        updateEmbedCode();
        saveDeclaration();

        if (entries.length === 0) {
            htmlPreviewSection.style.display = 'none';
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
        updateEmbedCode();
        saveDeclaration();
        
        // Auto-update graphic
        renderGraphic();
    }

    function renderEntriesList() {
        if (entries.length === 0) {
            entriesList.innerHTML = '<div class="empty-state">No entries added yet.</div>';
            return;
        }

        entries.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'entry-item';
            
            // Create modifier link
            const modifierLink = entry.modifierUrl 
                ? `<a href="${entry.modifierUrl}" style="text-decoration: none; color: inherit; font-weight: bold;">${entry.modifier}</a>`
                : `<strong>${entry.modifier}</strong>`;
            
            // Create usage link
            const usageLink = entry.usageUrl
                ? `<a href="${entry.usageUrl}" style="text-decoration: none; color: inherit;">${entry.usageName}</a>`
                : `${entry.usageName}`;
            
            div.innerHTML = `
                <div class="entry-info">
                    ${modifierLink} - ${usageLink}
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

    function updateEmbedCode() {
        // Determine baseurl dynamically
        const currentUrl = window.location.href;
        const urlParts = currentUrl.split('/');
        const origin = window.location.origin;
        let basePath = '';
        const aiulIndex = urlParts.findIndex(part => part === 'aiul' || part.includes('aiul'));
        if (aiulIndex !== -1) {
            basePath = urlParts.slice(0, aiulIndex + 1).join('/').replace(origin, '');
        }
        
        let html = `<style>@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap');
    .aiul-card { border: 4px solid #000; padding: 20px; font-family: 'Kanit', 'Segoe UI', Arial, sans-serif; max-width: 600px; background: #fff; }
    .aiul-header { font-weight: 400; font-size: 24px; letter-spacing: 1px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .aiul-entry { margin-bottom: 25px; }
    .aiul-entry:last-child { margin-bottom: 0; }
    .aiul-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .aiul-badge, .aiul-badge:visited, .aiul-badge:active, .aiul-badge:hover { background: #000; color: #fff !important; padding: 6px 12px; font-weight: 400; font-size: 14px; text-transform: uppercase; text-decoration: none; display: inline-block; line-height: 1; }
    .aiul-arrow { font-weight: 400; font-size: 20px; line-height: 1; }
    .aiul-icon { width: 20px; height: 20px; display: inline-block; vertical-align: middle; }
    .aiul-usage, .aiul-usage:visited, .aiul-usage:active, .aiul-usage:hover { font-weight: 400; font-size: 18px; color: #000 !important; text-decoration: none; }
    .aiul-details { font-size: 14px; color: #333; line-height: 20px; margin-top: 10px; }
    .aiul-details .label { font-weight: 400; }
    </style>
    <div class="aiul-card">
      <div class="aiul-header">AI USAGE DECLARATION</div>`;
        
        entries.forEach(e => {
            // Get modifier short code for display
            const modifierCode = getModifierCode(e.modifier);
            
            // Use the stored modifierUrl from entry, or construct it
            const modifierUrl = e.modifierUrl 
                ? `${origin}${e.modifierUrl}1.0.0/`
                : `${origin}${basePath}/modifiers/${e.modifier.toLowerCase().replace(/\s+/g, '-')}/1.0.0/`;
            
            // Use the stored usageUrl from entry
            const usageUrl = e.usageUrl
                ? `${origin}${e.usageUrl}`
                : `${origin}${basePath}/usage-levels/${e.usageId}/1.0.0/`;
            
            // Get icon SVG
            const iconPath = getIconPath(e.usageIcon);
            
            html += `
    <div class="aiul-entry">
        <div class="aiul-row">
            <a href="${modifierUrl}" class="aiul-badge" title="Learn more about ${modifierCode} modifier">${modifierCode}</a>
            <span class="aiul-arrow" aria-hidden="true">→</span>
            <svg class="aiul-icon" viewBox="0 0 24 24" aria-hidden="true">
                <defs><style>.icon-path { fill: none; stroke: black; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }</style></defs>
                ${iconPath}
            </svg>
            <a href="${usageUrl}" class="aiul-usage" title="Learn more about ${e.usageName}">${e.usageName}</a>
        </div>
        ${e.tools || e.notes ? `<div class="aiul-details">${e.tools ? '<span><span class="label">Tools:</span> ' + e.tools + '</span>' : ''}${e.tools && e.notes ? '<br />' : ''}${e.notes ? '<span>' + e.notes + '</span>' : ''}</div>` : ''}
    </div>`;
        });
        
        html += `</div>`;
        
        // Update the embed code display and preview
        embedCodeDisplay.textContent = html;
        embedPreview.innerHTML = html;
        
        // Show/hide the HTML preview section based on whether there are entries
        if (entries.length > 0) {
            htmlPreviewSection.style.display = 'block';
        } else {
            htmlPreviewSection.style.display = 'none';
        }
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
      @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&amp;display=swap');
      .header { font-family: 'Kanit', sans-serif; font-weight: 400; font-size: 24px; letter-spacing: 1px; }
      .mod-bg { fill: black; }
      .mod-text { fill: white; font-family: 'Kanit', sans-serif; font-weight: 400; font-size: 14px; text-transform: uppercase; }
      .arrow { fill: black; font-family: 'Kanit', sans-serif; font-size: 20px; font-weight: 400; }
      .usage { fill: black; font-family: 'Kanit', sans-serif; font-weight: 400; font-size: 18px; }
      .details { fill: #333; font-family: 'Kanit', sans-serif; font-size: 14px; font-weight: 400; }
      .details-label { font-weight: 400; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
  <rect x="2" y="2" width="${width-4}" height="${totalHeight-4}" fill="none" stroke="black" stroke-width="4"/>
  
  <text x="${padding}" y="40" class="header">AI USAGE DECLARATION</text>
  <line x1="${padding}" y1="55" x2="${width-padding}" y2="55" stroke="black" stroke-width="2"/>
`;

        let y = 90;
        entries.forEach(e => {
            // Get modifier short code for display
            const modifierCode = getModifierCode(e.modifier);
            
            // Modifier Badge
            const modWidth = (modifierCode.length * 9) + 24;
            
            svg += `<rect x="${padding}" y="${y-18}" width="${modWidth}" height="26" class="mod-bg"/>`;
            svg += `<text x="${padding + 12}" y="${y}" class="mod-text">${modifierCode}</text>`;
            
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
            
            // Set timeout in case image loading hangs
            const timeout = setTimeout(() => {
                URL.revokeObjectURL(url);
                console.error('SVG image loading timeout');
                alert('Error generating PNG. The SVG took too long to load. Please try downloading SVG instead.');
            }, 5000);
            
            img.onload = function() {
                clearTimeout(timeout);
                try {
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
                } catch (drawError) {
                    console.error('Error drawing to canvas:', drawError);
                    alert('Error drawing to canvas. Please try downloading SVG instead.');
                    URL.revokeObjectURL(url);
                }
            };
            
            img.onerror = function(error) {
                clearTimeout(timeout);
                console.error('Failed to load SVG image:', error);
                console.error('SVG content first 500 chars:', svgContent.substring(0, 500));
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
