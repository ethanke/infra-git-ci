# Lum Internals

**Lum Internals** is the shared frontend library for the Lum.tools ecosystem. It implements the **"Luminous Efficiency"** design system—a high-performance, isomorphic UI language featuring glassmorphism, liquid gradients, and depth effects.

This library is designed to be consumed by Next.js applications (like `lum-platform-front-v2` and `blog-next`) to ensure brand consistency and reduce redundancy.

## Features

- **Design System**: "Luminous Efficiency" (Glass, Liquid, Isomorphic).
- **Tailwind Preset**: Shared configuration for colors, animations, and typography.
- **UI Components**: Radix UI-based primitives with custom "Glass" variants.
- **Hooks**: Common React hooks for mobile detection, keyboard shortcuts, etc.
- **Utilities**: `cn` (classnames) and other helpers.

## Installation

```bash
npm install @lum-tools/lum-internals
# or via git
npm install git+ssh://git@github.com:lum-tools/lum-internals.git
```

## Setup

### 1. Configure Tailwind CSS

Add the preset to your `tailwind.config.ts` (or `.js`) to inherit the design tokens and plugins.

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";
import { lumPreset } from "@lum-tools/lum-internals/tailwind.preset";

const config: Config = {
  presets: [lumPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    // Ensure Tailwind scans the library components
    "./node_modules/@lum-tools/lum-internals/dist/**/*.js", 
  ],
  // ... your other config
};

export default config;
```

### 2. Import Global Styles

Import the global CSS in your root layout or `_app.tsx` to load the CSS variables and base styles.

```typescript
// src/app/layout.tsx
import "@lum-tools/lum-internals/styles/globals.css";
// ...
```

## Usage

### Components

Components are exported from the main entry point or subpaths. They feature a `variant="glass"` prop for the signature look.

```tsx
import { Button, Card, CardHeader, CardContent } from "@lum-tools/lum-internals/components/ui";

export default function Dashboard() {
  return (
    <Card variant="glass" className="max-w-md">
      <CardHeader>
        <h2 className="text-xl font-bold text-luminous-foreground">Welcome</h2>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">
          Experience the liquid interface.
        </p>
        <Button variant="liquid">
          Get Started
        </Button>
        <Button variant="glass" className="ml-2">
          Documentation
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Design Tokens

You can use the design tokens directly in your Tailwind classes.

- **Glass Effect**: `glass` utility class (e.g., `<div className="glass p-4">`).
- **Colors**: `bg-luminous`, `text-cosmic`, `border-quantum`.
- **Animations**: `animate-liquid-flow`, `animate-shimmer`.

### Hooks

```tsx
import { useMobile, useKeyboardShortcut } from "@lum-tools/lum-internals/hooks";

export function MyComponent() {
  const isMobile = useMobile();

  useKeyboardShortcut("k", () => {
    console.log("Cmd+K pressed");
  });

  return <div>{isMobile ? "Mobile View" : "Desktop View"}</div>;
}
```

## Development

### Build

The library uses `tsup` for bundling.

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Publishing

This package is published to the private GitHub registry.

```bash
npm publish
```
