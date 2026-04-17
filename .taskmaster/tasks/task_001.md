# Task ID: 1

**Title:** Initialize React + Vite project with TypeScript and Tailwind CSS

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Set up the foundational project with Vite, React 18, TypeScript, and Tailwind CSS. PWA configuration happens in Task 10.

**Details:**

1. Initialize project with Vite React-TS template
2. Install and configure Tailwind CSS with darkMode: 'class'
3. Configure TypeScript strict mode and path aliases
4. Set up ESLint + Prettier
5. Create folder structure and clean up boilerplate

**Test Strategy:**

Verify: dev server starts, Tailwind dark theme renders, TypeScript compiles, build succeeds

## Subtasks

### 1.1. Initialize Vite project and install dependencies

**Status:** pending
**Dependencies:** None

Run vite create with react-ts template. Install Tailwind CSS + PostCSS + Autoprefixer. Verify dev server starts.

### 1.2. Configure Tailwind CSS with dark mode

**Status:** pending
**Dependencies:** 1.1

Configure tailwind.config.js (darkMode: 'class', content paths). Add Tailwind directives to index.css. Set global dark base styles. Delete App.css.

### 1.3. Configure TypeScript strict mode and ESLint + Prettier

**Status:** pending
**Dependencies:** 1.1

Enable strict TS options. Add path aliases (@/*) in tsconfig + vite.config. Install and configure ESLint + Prettier.

### 1.4. Create folder structure and clean up boilerplate

**Status:** pending
**Dependencies:** 1.2, 1.3

Create src/{components, pages, hooks, services, types, utils, contexts, data}. Remove Vite template files. Create minimal App.tsx with dark theme.
