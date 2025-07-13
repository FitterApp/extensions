# Extension Template

## Structure
```
extension-name/
├── src/
│   ├── main-component.vue      # Main Vue component
│   ├── extension-name.ts       # Entry point (exports mount/unmount)
│   ├── lib/
│   │   └── mount-manager.ts   # Standard mount manager
│   ├── assets/
│   │   ├── main.css           # Main styles
│   │   └── base.css           # Base styles
│   └── components/            # Vue components
├── manifest.json              # Extension metadata
├── package.json              # Dependencies
└── vite.config.js            # Build config
```

## Key Patterns

### Entry Point Pattern
```typescript
import MainComponent from './main-component.vue'
import { createMountPair } from './lib/mount-manager'

export const { mount, unmount } = createMountPair(MainComponent)
```

### Vite Config Pattern
```javascript
const outDir = path.resolve(__dirname, '../../dist', 'extension-name')
// Use extension name in base path and entry points
```

### Manifest Pattern
```json
{
  "entrypoints": ["extension-name"],
  "styles": "extension-name.css",
  "name": "Extension Name",
  "description": "Description",
  "version": "1.0.0"
}
```

## Common Gotchas
- Always use extension name in vite config base path
- Entry point file should match manifest entrypoints
- Mount manager must be in lib/mount-manager.ts
- CSS files should be in assets/main.css 