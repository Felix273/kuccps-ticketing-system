# Styling

The frontend uses Tailwind CSS with a custom design system for consistent branding and responsive design.

## Tailwind Configuration

**File:** `frontend/tailwind.config.js`

The Tailwind configuration extends the default theme with:

- Custom brand colors
- Animation keyframes
- Extended font families
- Dark mode support

## Design System

### Brand Colors

Brand colors are configurable through `SystemSettings` and applied dynamically:

```javascript
document.documentElement.style.setProperty('--brand-primary', settings.primaryColor || '#911414');
document.documentElement.style.setProperty('--brand-secondary', settings.secondaryColor || '#d20001');
```

### Default Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#911414` | KUCCPS brand red, buttons, headers |
| Secondary | `#d20001` | Accent color, hover states |
| Dark | `#1f2937` | Dark mode backgrounds |
| Gray | `#6b7280` | Secondary text, borders |

## CSS Architecture

### Global Styles (`index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --brand-primary: #911414;
    --brand-secondary: #d20001;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-lg text-white font-medium;
    background-color: var(--brand-primary);
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
}
```

### Animations (`styles/animations.css`)

Custom animations for:
- Fade in/out
- Slide in from bottom
- Spinner rotation
- Pulse effects for notifications

## Responsive Design

The application uses a mobile-first approach with Tailwind responsive prefixes:

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

## Theme Variants

### Dark Mode

Enabled via `darkModeEnabled` in `SystemSettings`:

```css
.theme-dark {
  background-color: #1f2937;
  color: #f9fafb;
}
```

### High Contrast Mode

Enabled via `contrastMode` in `SystemSettings`:

```css
.theme-high-contrast {
  filter: contrast(1.5);
}
```

## PostCSS Pipeline

**File:** `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Autoprefixer automatically adds vendor prefixes for cross-browser compatibility.
