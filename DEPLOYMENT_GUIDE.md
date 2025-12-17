# How to Setup GitHub Pages Deployment for Vite + React

This document outlines the steps taken to configure automated deployment to GitHub Pages for this project.

## 1. Install `gh-pages` Package

We installed the `gh-pages` package as a dev dependency. This tool handles the process of pushing the build folder to a specific branch (usually `gh-pages`) on GitHub.

```bash
npm install gh-pages --save-dev
```

## 2. Configure `vite.config.js`

Since this is a Project Page (not a User Page), it is served from a subdirectory (`https://<username>.github.io/<repo-name>/`). We must tell Vite to use this base path for assets.

**File:** `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/lifeintheuk/', // <--- IMPORTANT: Matches your repository name
})
```

## 3. Update `package.json`

We added the `homepage` field and deployment scripts.

**File:** `package.json`
```json
{
  // ...
  "homepage": "https://sarvjan.github.io/lifeintheuk", // <--- The URL where the app will live
  "scripts": {
    // ...
    "predeploy": "npm run build",   // Runs automatically before 'deploy' to ensure fresh build
    "deploy": "gh-pages -d dist"    // Pushes the 'dist' folder to the gh-pages branch
  }
}
```

## 4. Deploying

To deploy updates, simply run:

```bash
npm run deploy
```

This command does the following:
1.  Runs `npm run build` (triggering Vite build).
2.  Creates a production-ready `dist` folder.
3.  Uses `gh-pages` to commit and push that `dist` folder to a branch named `gh-pages` on your remote repository.

## 5. GitHub Settings

After the first deploy, verify settings on GitHub:
1.  Go to **Settings** > **Pages**.
2.  Under **Build and deployment**, select **Deploy from a branch**.
3.  Select **Branch**: `gh-pages` and **Folder**: `/ (root)`.
