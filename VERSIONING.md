# AIUL Versioning System

This document explains the versioning system used in the AI Usage License (AIUL) framework.

## Overview

AIUL uses a **hybrid versioning approach** that balances maintainability with flexibility:

- **Licenses** and **Modifiers** are versioned individually with dedicated URL paths
- **Combinations** use query parameters to specify versions, avoiding the need to maintain hundreds of versioned files

## URL Structure

### 1. Versioned Components (Licenses & Modifiers)

Each license and modifier has its own versioned documentation:

```
/aiul/{type}/{id}/{version}/
```

**Examples:**
- `/aiul/licenses/na/1.0.0/` - No Attribution license v1.0.0
- `/aiul/modifiers/writing/1.0.0/` - Writing modifier v1.0.0
- `/aiul/usage-levels/generation/1.0.0/` - Generation usage level v1.0.0

**Latest version shortcuts:**
```
/aiul/{type}/{id}/
```

These URLs redirect to the latest version:
- `/aiul/licenses/na/` → `/aiul/licenses/na/1.0.0/`
- `/aiul/modifiers/writing/` → `/aiul/modifiers/writing/1.0.0/`

### 2. Combination Pages (License + Modifier)

Combinations use a base URL with query parameters for versioning:

```
/combinations/{license-code}-{modifier-code}.html?license={version}&modifier={version}
```

**Examples:**
- `/combinations/na-wr.html` - Default (latest versions)
- `/combinations/na-wr.html?license=1.0.0&modifier=1.0.0` - Specific versions
- `/combinations/cd-im.html?license=1.1.0&modifier=1.0.0` - Mixed versions

**Benefits:**
- Stable URLs for combinations (48 pages instead of 48×N×M pages)
- Version-specific views via query parameters
- Easy to share specific version combinations
- Single page to maintain per combination

## Version Data Structure

All version metadata is stored in `_data/aiul.yml`:

```yaml
licenses:
  items:
    na:
      name: "No Attribution"
      code: "NA"
      versions:
        1.0.0:
          released: "2025-12-09"
          url: "/aiul/licenses/na/1.0.0/"
          
modifiers:
  items:
    writing:
      name: "Writing"
      code: "WR"
      versions:
        1.0.0:
          released: "2024-01-15"
          url: "/aiul/modifiers/writing/1.0.0/"
```

## File Organization

### Versioned Content Structure

```
_aiul/
  licenses/
    na/
      index.md              # Redirects to latest version
      1.0.0/
        index.md           # Full license content
  modifiers/
    writing/
      index.md              # Redirects to latest version
      1.0.0/
        index.md           # Full modifier content
  usage-levels/
    generation/
      index.md              # Redirects to latest version
      1.0.0/
        index.md           # Full usage level content
```

### Collection Files (Legacy)

The original collection files remain for backward compatibility and combination generation:

```
_licenses/
  aiul-na.md              # Has redirect_to: /licenses/na/
_modifiers/
  writing.md              # Has redirect_to: /modifiers/writing/
```

These files include `redirect_to` frontmatter that sends users to the new AIUL structure.

## Version Selection UI

Combination pages include a version selector that allows users to:

1. View current version information
2. Select different license versions
3. Select different modifier versions
4. See the URL for the selected version combination

The JavaScript on combination pages:
- Reads `?license=` and `?modifier=` query parameters
- Updates dropdown selectors to match
- Displays version info when viewing non-latest versions
- Updates the URL when versions are changed

## Adding New Versions

To add a new version of a license, modifier, or usage level:

### 1. Create the Versioned Page

```bash
# Example: Creating NA license v1.1.0
mkdir -p _aiul/licenses/na/1.1.0
cp _aiul/licenses/na/1.0.0/index.md _aiul/licenses/na/1.1.0/index.md
```

Edit the new `index.md`:
```yaml
---
layout: aiul
title: "No Attribution (NA)"
version: "1.1.0"
released: "2025-06-15"
redirect_from:
  - /licenses/aiul-na.html
permalink: /aiul/licenses/na/1.1.0/
---
```

### 2. Update Version Metadata

Edit `_data/aiul.yml` to add the new version:

```yaml
licenses:
  items:
    na:
      versions:
        1.1.0:
          released: "2025-06-15"
          url: "/aiul/licenses/na/1.1.0/"
        1.0.0:
          released: "2025-12-09"
          url: "/aiul/licenses/na/1.0.0/"
```

### 3. Update Latest Redirect

If this is the new latest version, update the redirect page:

```yaml
# _aiul/licenses/na/index.md
---
layout: aiul
redirect_to: /aiul/licenses/na/1.1.0/
permalink: /aiul/licenses/na/
---
```

### 4. Update Version Selectors

The combination pages automatically populate version selectors from `_data/aiul.yml`, so no additional changes are needed if you've updated the YAML file correctly.

## Benefits of This Approach

1. **Maintainable**: Only 6 licenses + 8 modifiers = 14 versioned items to manage
2. **Flexible**: 48 combination pages support any version via query params
3. **Scalable**: Adding new versions doesn't exponentially increase file count
4. **User-Friendly**: Clean URLs with optional version parameters
5. **Backward Compatible**: Old URLs redirect to new structure
6. **Creative Commons-style**: Follows established patterns like CC licenses

## Backward Compatibility

All old URLs redirect to the new structure:

- `/licenses/aiul-na.html` → `/aiul/licenses/na/` → `/aiul/licenses/na/1.0.0/`
- `/modifiers/writing.html` → `/aiul/modifiers/writing/` → `/aiul/modifiers/writing/1.0.0/`

This is accomplished using the `jekyll-redirect-from` plugin with `redirect_from` and `redirect_to` frontmatter.

## Current Versions

### Licenses (6)
- NA (No Attribution) - v1.0.0
- WA (With Attribution) - v1.0.0
- CD (Commercially Derived) - v1.0.0
- TC (Training/Curriculum) - v1.0.0
- DP (Derivative Prohibited) - v1.0.0
- IU (Internal Use) - v1.0.0

### Modifiers (8)
- Writing (WR) - v1.0.0
- Image (IM) - v1.0.0
- Video (VD) - v1.0.0
- Audio (AU) - v1.0.0
- 3D (3D) - v1.0.0
- Traditional Media (TR) - v1.0.0
- Mixed Media (MX) - v1.0.0
- Code (CO) - v1.0.0

### Usage Levels (4)
- Generation - v1.0.0
- Ideation - v1.0.0
- Refinement - v1.0.0
- Assistance - v1.0.0

### Declarations (1)
- Current version: 1.0.0

## Technical Implementation

- **Jekyll Collections**: `_aiul`, `_licenses`, `_modifiers` collections
- **Layouts**: 
  - `aiul.html` - Main layout for AIUL content pages
  - `combination-versioned.html` - Layout for combination pages with version support
- **Plugin**: `combination_generator.rb` generates 48 combination pages with versioned layout
- **Redirect Plugin**: `jekyll-redirect-from` handles URL redirects
- **Data**: `_data/aiul.yml` stores all version metadata
- **JavaScript**: Client-side handling of version query parameters on combination pages
