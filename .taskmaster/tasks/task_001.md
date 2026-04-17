# Task ID: 1

**Title:** Initialize React + Vite PWA project with TypeScript and Tailwind CSS

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Set up the foundational project structure using Vite, React 18, TypeScript, Tailwind CSS, and PWA capabilities for offline-first functionality

**Details:**

1. Run `npm create vite@latest . -- --template react-ts` to initialize React with TypeScript
2. Install dependencies: `npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa`
3. Initialize Tailwind: `npx tailwindcss init -p`
4. Configure tailwind.config.js with content paths: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']
5. Add Tailwind directives to src/index.css: @tailwind base; @tailwind components; @tailwind utilities;
6. Install vite-plugin-pwa and configure in vite.config.ts with registerType: 'autoUpdate', workbox strategies for offline caching
7. Add PWA manifest.json with app name 'Workout Plan PWA', theme_color: dark, display: 'standalone', icons (192x192, 512x512)
8. Configure TypeScript strict mode in tsconfig.json
9. Set up ESLint and Prettier for code quality
10. Create basic folder structure: src/{components, pages, hooks, services, types, utils}

**Test Strategy:**

Verify: npm run dev starts development server successfully, Tailwind classes render correctly, PWA manifest is accessible at /manifest.json, Service worker registers in browser DevTools, TypeScript compilation has no errors

## Subtasks

### 1.1. Initialize Vite project with React-TypeScript template and install base dependencies

**Status:** pending  
**Dependencies:** None  

Bootstrap the foundational Vite + React + TypeScript project structure and install all core dependencies required for the application stack

**Details:**

1. Run `npm create vite@latest . -- --template react-ts` in the project root to initialize React 18 with TypeScript using Vite's official template
2. Accept any prompts to scaffold the project in the current directory (only TaskMaster config and README.md exist currently)
3. Install base dependencies: `npm install` to set up React, React-DOM, Vite, and TypeScript packages
4. Verify package.json contains: react@^18.x, react-dom@^18.x, vite@^5.x, typescript@^5.x, @vitejs/plugin-react
5. Create .gitignore file (if not generated) with entries: node_modules/, dist/, .env.local, *.log
6. Test the installation by running `npm run dev` and verify the development server starts without errors on localhost:5173
7. Verify the default Vite + React template files exist: src/App.tsx, src/main.tsx, index.html, vite.config.ts, tsconfig.json, tsconfig.node.json
8. Stop the dev server (Ctrl+C) after confirming it works
9. Review tsconfig.json to ensure it has baseline TypeScript configuration (target: ES2020, useDefineForClassFields, lib, module, jsx, strict options)
10. Confirm public/ directory exists for static assets (will hold PWA icons and manifest later)

### 1.2. Install and configure Tailwind CSS with PostCSS and dark theme setup

**Status:** pending  
**Dependencies:** 1.1  

Set up Tailwind CSS with PostCSS configuration, initialize Tailwind config file with dark mode enabled, and integrate Tailwind directives into the application's main CSS file

**Details:**

1. Install Tailwind CSS and its peer dependencies: `npm install -D tailwindcss@^3.4 postcss@^8 autoprefixer@^10`
2. Initialize Tailwind configuration: `npx tailwindcss init -p` which generates tailwind.config.js and postcss.config.js
3. Open tailwind.config.js and configure content paths to scan for Tailwind classes: content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']
4. Enable class-based dark mode in tailwind.config.js: darkMode: 'class' (allows manual dark mode toggle)
5. Optionally extend the theme with custom colors for the dark UI aesthetic: theme: { extend: { colors: { primary: '#3B82F6' } } }
6. Open src/index.css and replace all existing content with Tailwind directives:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
7. Add global dark theme base styles in src/index.css:
   @layer base {
     body {
       @apply bg-gray-900 text-gray-100;
     }
   }
8. Update src/App.tsx to use Tailwind classes: add className="min-h-screen bg-gray-900 text-white flex items-center justify-center" to the root div
9. Delete src/App.css file (no longer needed as Tailwind handles all styling)
10. Test Tailwind by running `npm run dev` and verify dark background (bg-gray-900) and white text (text-white) render correctly in the browser

### 1.3. Install vite-plugin-pwa and configure service worker with manifest for PWA capabilities

**Status:** pending  
**Dependencies:** 1.1  

Integrate the vite-plugin-pwa package, configure Workbox service worker strategies for offline caching, and set up the PWA manifest.json with app metadata and icons

**Details:**

1. Install vite-plugin-pwa plugin: `npm install -D vite-plugin-pwa@^0.17 workbox-window@^7`
2. Open vite.config.ts and import the plugin: import { VitePWA } from 'vite-plugin-pwa'
3. Add VitePWA to the plugins array in vite.config.ts with configuration:
   VitePWA({
     registerType: 'autoUpdate',
     includeAssets: ['favicon.ico', 'robots.txt', '*.png'],
     workbox: {
       globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif}'],
     },
     manifest: {
       name: 'Workout Plan PWA',
       short_name: 'Workout',
       description: 'Track your gym workouts offline-first',
       theme_color: '#111827',
       background_color: '#111827',
       display: 'standalone',
       icons: [
         { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
         { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
       ]
     },
     devOptions: { enabled: true }
   })
4. Create placeholder PWA icon files in public/ directory: icon-192x192.png and icon-512x512.png (can use simple colored squares for now, will replace with actual icons later)
5. Add theme-color meta tag to index.html head section: <meta name="theme-color" content="#111827" />
6. Run `npm run build` to generate the production build and verify dist/manifest.webmanifest is created
7. Serve the production build locally: `npx vite preview` and test PWA installation in Chrome DevTools > Application > Manifest
8. Verify service worker registration in DevTools > Application > Service Workers tab
9. Test offline functionality by enabling offline mode in DevTools Network tab and verifying cached assets load
10. Note: Full Workbox caching strategies will be enhanced in Task 10, this subtask sets up the foundation

### 1.4. Configure TypeScript strict mode and install ESLint + Prettier for code quality

**Status:** pending  
**Dependencies:** 1.1  

Enable TypeScript strict compiler options for enhanced type safety, set up ESLint with TypeScript and React plugins, and configure Prettier for consistent code formatting

**Details:**

1. Open tsconfig.json and enable strict TypeScript options:
   "strict": true,
   "noUnusedLocals": true,
   "noUnusedParameters": true,
   "noFallthroughCasesInSwitch": true,
   "noImplicitReturns": true
2. Add path aliases for cleaner imports in tsconfig.json:
   "baseUrl": ".",
   "paths": {
     "@/*": ["./src/*"]
   }
3. Update vite.config.ts to resolve path aliases: add resolve: { alias: { '@': '/src' } } to defineConfig
4. Install ESLint and TypeScript plugins: `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks`
5. Install Prettier and integration: `npm install -D prettier eslint-config-prettier eslint-plugin-prettier`
6. Create .eslintrc.json with configuration:
   {
     "extends": [
       "eslint:recommended",
       "plugin:@typescript-eslint/recommended",
       "plugin:react/recommended",
       "plugin:react-hooks/recommended",
       "prettier"
     ],
     "parser": "@typescript-eslint/parser",
     "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
     "rules": {
       "react/react-in-jsx-scope": "off",
       "@typescript-eslint/no-unused-vars": "warn"
     },
     "settings": { "react": { "version": "detect" } }
   }
7. Create .prettierrc with formatting rules:
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2
   }
8. Create .prettierignore: add dist/, node_modules/, *.config.js, .taskmaster/
9. Add npm scripts to package.json:
   "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
   "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
10. Run `npm run lint` and `npm run format` to verify setup, fix any errors in default Vite template files

### 1.5. Create organized project folder structure and clean up Vite template boilerplate

**Status:** pending  
**Dependencies:** 1.2, 1.4  

Establish a scalable directory structure for components, pages, services, hooks, types, and utilities, then remove unnecessary Vite template boilerplate code

**Details:**

1. Create organized folder structure in src/:
   - `mkdir -p src/components` (reusable UI components)
   - `mkdir -p src/pages` (route-level page components)
   - `mkdir -p src/hooks` (custom React hooks)
   - `mkdir -p src/services` (API clients, Supabase integration)
   - `mkdir -p src/types` (TypeScript type definitions and interfaces)
   - `mkdir -p src/utils` (helper functions, formatters, constants)
   - `mkdir -p src/contexts` (React Context providers for global state)
   - `mkdir -p src/data` (seed data, mock data, constants)
2. Create placeholder barrel export files for cleaner imports:
   - `echo 'export {};' > src/components/index.ts`
   - Repeat for other folders (pages, hooks, utils, contexts)
3. Remove default Vite template files: delete src/App.css, delete public/vite.svg, delete src/assets/react.svg
4. Create new minimal src/App.tsx:
   export default function App() {
     return (
       <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
         <h1 className="text-4xl font-bold">Workout Plan PWA</h1>
       </div>
     )
   }
5. Ensure src/main.tsx uses StrictMode and imports index.css:
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.tsx'
   import './index.css'
   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   )
6. Create src/types/database.types.ts (empty file for now, will hold Supabase-generated types later): export type {}
7. Create src/utils/constants.ts with initial app constants:
   export const APP_NAME = 'Workout Plan PWA'
   export const APP_VERSION = '0.1.0'
8. Update index.html title tag to: <title>Workout Plan PWA</title>
9. Create public/robots.txt for SEO: User-agent: *\nAllow: /
10. Run `npm run dev` and verify the clean setup displays 'Workout Plan PWA' heading with dark theme, run `npm run build` to confirm production build succeeds
