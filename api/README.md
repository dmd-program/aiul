# AIUL API Documentation

The AIUL API provides programmatic access to all license information, modifiers, combinations, and associated images for easy integration into external websites and applications.

## Base URL

```
https://dmd-program.github.io/aiul/api/
```

## Endpoints

### Main API
`GET /api/v1.json`

Returns complete AIUL data including licenses, modifiers, combinations, and usage levels.

**Response:**
```json
{
  "version": "1.0.0",
  "generated": "2025-01-30T...",
  "baseUrl": "https://dmd-program.github.io/aiul",
  "documentation": "https://dmd-program.github.io/aiul/guide.html",
  "licenses": [...],
  "modifiers": [...],
  "combinations": [...],
  "usageLevels": [...]
}
```

### Licenses
`GET /api/licenses.json`

Returns all available licenses.

**Response:**
```json
{
  "version": "1.0.0",
  "generated": "2025-01-30T...",
  "data": [
    {
      "id": "na",
      "code": "NA",
      "title": "AIUL-NA",
      "fullName": "Not Allowed",
      "version": "1.0.0",
      "url": "https://dmd-program.github.io/aiul/licenses/na/1.0.0/",
      "image": "https://dmd-program.github.io/aiul/assets/images/licenses/aiul-na.png",
      "released": "2025-12-09"
    }
  ]
}
```

### Modifiers
`GET /api/modifiers.json`

Returns all available domain modifiers.

**Response:**
```json
{
  "version": "1.0.0",
  "generated": "2025-01-30T...",
  "data": [
    {
      "id": "3d",
      "code": "3D",
      "title": "3D Design",
      "fullName": "3-Dimensional Design",
      "version": "1.0.0",
      "url": "https://dmd-program.github.io/aiul/modifiers/3d/1.0.0/",
      "released": "2025-12-09"
    }
  ]
}
```

### Combinations
`GET /api/combinations.json`

Returns all license + modifier combinations (48 total).

**Response:**
```json
{
  "version": "1.0.0",
  "generated": "2025-01-30T...",
  "data": [
    {
      "id": "na-3d",
      "code": "NA-3D",
      "license": {
        "id": "na",
        "code": "NA",
        "title": "AIUL-NA"
      },
      "modifier": {
        "id": "3d",
        "code": "3D",
        "title": "3D Design"
      },
      "url": "https://dmd-program.github.io/aiul/combinations/na-3d.html",
      "image": "https://dmd-program.github.io/aiul/assets/images/licenses/aiul-na-3d.png"
    }
  ]
}
```

## Usage Examples

### JavaScript/Fetch API

```javascript
// Fetch all licenses
fetch('https://dmd-program.github.io/aiul/api/licenses.json')
  .then(response => response.json())
  .then(data => {
    data.data.forEach(license => {
      console.log(`${license.title}: ${license.fullName}`);
      console.log(`Image: ${license.image}`);
    });
  });

// Fetch a specific combination
fetch('https://dmd-program.github.io/aiul/api/combinations.json')
  .then(response => response.json())
  .then(data => {
    const combination = data.data.find(c => c.code === 'NA-3D');
    if (combination) {
      console.log(`Found: ${combination.code}`);
      console.log(`URL: ${combination.url}`);
      console.log(`Image: ${combination.image}`);
    }
  });
```

### Display License Badge

```html
<!DOCTYPE html>
<html>
<head>
  <title>AIUL License Badge Example</title>
</head>
<body>
  <h1>My Project</h1>
  <div id="license-badge"></div>

  <script>
    async function displayLicenseBadge(licenseCode) {
      const response = await fetch('https://dmd-program.github.io/aiul/api/licenses.json');
      const data = await response.json();
      const license = data.data.find(l => l.code === licenseCode);
      
      if (license) {
        const badge = document.getElementById('license-badge');
        badge.innerHTML = `
          <a href="${license.url}" target="_blank">
            <img src="${license.image}" alt="${license.title}" />
          </a>
        `;
      }
    }

    displayLicenseBadge('NA');
  </script>
</body>
</html>
```

### Display License + Modifier Combination

```html
<div id="combination-badge"></div>

<script>
  async function displayCombination(licenseCode, modifierCode) {
    const response = await fetch('https://dmd-program.github.io/aiul/api/combinations.json');
    const data = await response.json();
    const code = `${licenseCode}-${modifierCode}`;
    const combination = data.data.find(c => c.code === code);
    
    if (combination) {
      const badge = document.getElementById('combination-badge');
      badge.innerHTML = `
        <a href="${combination.url}" target="_blank">
          <img src="${combination.image}" alt="${combination.code}" 
               title="${combination.license.title} - ${combination.modifier.title}" />
        </a>
      `;
    }
  }

  displayCombination('CD', '3D');
</script>
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function AIULBadge({ licenseCode, modifierCode = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = modifierCode 
      ? 'https://dmd-program.github.io/aiul/api/combinations.json'
      : 'https://dmd-program.github.io/aiul/api/licenses.json';

    fetch(endpoint)
      .then(res => res.json())
      .then(result => {
        let item;
        if (modifierCode) {
          const code = `${licenseCode}-${modifierCode}`;
          item = result.data.find(c => c.code === code);
        } else {
          item = result.data.find(l => l.code === licenseCode);
        }
        setData(item);
        setLoading(false);
      });
  }, [licenseCode, modifierCode]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>License not found</div>;

  return (
    <a href={data.url} target="_blank" rel="noopener noreferrer">
      <img 
        src={data.image} 
        alt={data.code || data.title}
        style={{ height: '50px' }}
      />
    </a>
  );
}

// Usage:
<AIULBadge licenseCode="NA" />
<AIULBadge licenseCode="CD" modifierCode="3D" />
```

## CORS

All API endpoints support CORS and can be accessed from any domain.

## Rate Limiting

As this is a static API hosted on GitHub Pages, there are no rate limits. However, please cache responses appropriately to minimize bandwidth usage.

## Updates

The API data is regenerated on every site build. Check the `generated` timestamp in the response to see when the data was last updated.

## Support

For questions or issues, please visit the [AIUL GitHub repository](https://github.com/dmd-program/aiul).
