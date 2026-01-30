/**
 * AIUL Badge Widget
 * Easily embed AIUL license badges on your website
 * 
 * Usage:
 * <script src="https://dmd-program.github.io/aiul/assets/js/aiul-widget.js"></script>
 * <div class="aiul-badge" data-license="NA"></div>
 * <div class="aiul-badge" data-license="CD" data-modifier="3D"></div>
 */

(function() {
  'use strict';

  // Detect API base URL based on current location
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = isLocal 
    ? `${window.location.protocol}//${window.location.host}/aiul/api`
    : 'https://dmd-program.github.io/aiul/api';
  
  let licensesData = null;
  let combinationsData = null;

  // Load API data
  async function loadData() {
    if (!licensesData) {
      const response = await fetch(`${API_BASE}/licenses.json`);
      const data = await response.json();
      licensesData = data.data;
    }
    if (!combinationsData) {
      const response = await fetch(`${API_BASE}/combinations.json`);
      const data = await response.json();
      combinationsData = data.data;
    }
  }

  // Create badge element
  function createBadge(container, licenseCode, modifierCode = null) {
    const badge = document.createElement('a');
    badge.className = 'aiul-badge-link';
    badge.target = '_blank';
    badge.rel = 'noopener noreferrer';
    badge.style.display = 'inline-block';
    badge.style.textDecoration = 'none';

    const img = document.createElement('img');
    img.alt = modifierCode ? `${licenseCode}-${modifierCode}` : licenseCode;
    // Set explicit height for proper retina rendering (images are 2x resolution)
    const height = container.dataset.height || '28px';
    img.style.height = height;
    img.style.width = 'auto'; // Maintain aspect ratio
    img.style.display = 'block';
    // Tell browser this is a 2x image for retina
    img.style.imageRendering = 'auto';

    if (modifierCode) {
      const code = `${licenseCode}-${modifierCode}`;
      const combination = combinationsData.find(c => c.code === code);
      
      if (combination) {
        badge.href = combination.url;
        img.src = combination.image;
        img.title = `${combination.license.title} - ${combination.modifier.title}`;
      } else {
        container.textContent = `Invalid combination: ${code}`;
        return;
      }
    } else {
      const license = licensesData.find(l => l.code === licenseCode);
      
      if (license) {
        badge.href = license.url;
        img.src = license.image;
        img.title = `${license.title} - ${license.fullName}`;
      } else {
        container.textContent = `Invalid license: ${licenseCode}`;
        return;
      }
    }

    badge.appendChild(img);
    container.appendChild(badge);
  }

  // Initialize all badges on the page
  async function initializeBadges() {
    await loadData();

    const badges = document.querySelectorAll('.aiul-badge:not(.aiul-initialized)');
    
    badges.forEach(container => {
      const licenseCode = container.dataset.license;
      const modifierCode = container.dataset.modifier;

      if (!licenseCode) {
        container.textContent = 'Error: data-license attribute required';
        return;
      }

      createBadge(container, licenseCode.toUpperCase(), modifierCode ? modifierCode.toUpperCase() : null);
      container.classList.add('aiul-initialized');
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBadges);
  } else {
    initializeBadges();
  }

  // Expose global API for manual initialization
  window.AIULWidget = {
    initialize: initializeBadges,
    version: '1.0.0'
  };
})();
