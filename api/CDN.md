# AIUL CDN Usage

For optimal performance, we recommend loading the AIUL widget via jsDelivr CDN instead of directly from GitHub Pages.

## Why Use a CDN?

- **Faster Loading**: Global CDN edge servers closer to your users
- **Better Caching**: Aggressive caching reduces latency
- **Higher Availability**: Enterprise-grade uptime and reliability
- **Bandwidth Savings**: Reduces load on GitHub Pages

## CDN URLs

### Widget Script
```html
<!-- Production (main branch) -->
<script src="https://cdn.jsdelivr.net/gh/dmd-program/aiul@main/assets/js/aiul-widget.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/dmd-program/aiul@v1.0.0/assets/js/aiul-widget.js"></script>

<!-- Latest commit -->
<script src="https://cdn.jsdelivr.net/gh/dmd-program/aiul@latest/assets/js/aiul-widget.js"></script>
```

### API Endpoints
The API JSON files are still served from GitHub Pages as they need to be dynamically generated during the Jekyll build process:

```javascript
// API endpoints (use GitHub Pages, not CDN)
const API_BASE = 'https://dmd-program.github.io/aiul/api';
```

### License Images
Images can also be served via CDN for better performance:

```html
<!-- Via CDN -->
<img src="https://cdn.jsdelivr.net/gh/dmd-program/aiul@main/assets/images/licenses/aiul-na.png" alt="AIUL-NA">

<!-- Or use the API-provided URLs (GitHub Pages) -->
```

## Performance Comparison

| Source | Typical Load Time | Cache Duration | Global CDN |
|--------|------------------|----------------|------------|
| jsDelivr CDN | ~50-100ms | 7 days | ✅ Yes |
| GitHub Pages | ~200-500ms | 10 minutes | ❌ No |

## Version Pinning

For production sites, we recommend pinning to a specific version:

```html
<script src="https://cdn.jsdelivr.net/gh/dmd-program/aiul@v1.0.0/assets/js/aiul-widget.js"></script>
```

This ensures your integration won't break if we make breaking changes to the widget.

## Purging CDN Cache

jsDelivr automatically purges its cache within 7 days. To manually purge:

```bash
# Visit this URL to purge cache
https://purge.jsdelivr.net/gh/dmd-program/aiul@main/assets/js/aiul-widget.js
```

## Alternative CDNs

### unpkg (npm-based)
If we publish to npm in the future:
```html
<script src="https://unpkg.com/aiul-widget@latest/assets/js/aiul-widget.js"></script>
```

### GitHub Raw (Not Recommended)
Avoid using raw.githubusercontent.com as it has strict rate limits and no CDN:
```html
<!-- ❌ Don't use this -->
<script src="https://raw.githubusercontent.com/dmd-program/aiul/main/assets/js/aiul-widget.js"></script>
```

## Fallback Strategy

For maximum reliability, implement a fallback:

```html
<script src="https://cdn.jsdelivr.net/gh/dmd-program/aiul@main/assets/js/aiul-widget.js" 
        onerror="this.onerror=null; this.src='https://dmd-program.github.io/aiul/assets/js/aiul-widget.js'">
</script>
```

## More Information

- [jsDelivr Documentation](https://www.jsdelivr.com/documentation)
- [GitHub Integration](https://www.jsdelivr.com/github)
- [AIUL Widget Examples](https://dmd-program.github.io/aiul/assets/js/widget-examples.html)
