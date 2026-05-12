# Brew Graph

🍺 A modern web application to search, explore and manage Homebrew packages.

![Version](https://img.shields.io/github/package-json/v/dofy/brew-graph?style=flat&color=blue)
![License](https://img.shields.io/github/license/dofy/brew-graph?style=flat)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat&logo=pwa&logoColor=white)
![Homebrew](https://img.shields.io/badge/Homebrew-FBB040?style=flat&logo=homebrew&logoColor=black)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)

## ✨ Features

- 🔍 **Smart Search** - Fuzzy search by name and description with relevance ranking
- 📦 **Package Categories** - Browse Formulae and Casks separately
- 📋 **One-click Copy** - Quickly copy install commands
- 🔗 **Dependency Graph** - View and navigate package dependencies with breadcrumb trail
- 💾 **Offline Support** - Local IndexedDB caching with 48-hour auto-refresh
- ⭐ **Favorites & Tags** - Organize packages with favorites and custom tags
- ⌨️ **Full Keyboard Support** - Navigate entirely with keyboard shortcuts
- 🌓 **Dark Mode** - Light, dark, and system theme support
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 📲 **PWA Support** - Install as a native app on desktop and mobile

## 🔍 Search Syntax

| Syntax              | Description                              | Example              |
| ------------------- | ---------------------------------------- | -------------------- |
| `text`              | Search by name, aliases and description  | `react`              |
| `#tag`              | Filter by tag                            | `#frontend`          |
| `*`                 | Show only favorites                      | `*`                  |
| `kind:<value>`      | Cask category (app, font, pkg, mas, …)   | `kind:font`          |
| `tap:<value>`       | Filter by tap                            | `tap:homebrew/cask`  |
| `license:<value>`   | Formula license substring match          | `license:mit`        |
| `dep:<formula>`     | Packages depending on a formula          | `dep:openssl`        |
| Combined            | Combine any of the above                 | `editor kind:app`    |

## ⌨️ Keyboard Shortcuts

### Search

| Key         | Action                 |
| ----------- | ---------------------- |
| `⌘K` or `/` | Open search            |
| `Esc`       | Close dialog / Go home |

### Navigation

| Key       | Action          |
| --------- | --------------- |
| `Shift+H` | Go to Home      |
| `Shift+F` | Go to Favorites |
| `Shift+T` | Go to Tags      |
| `Shift+R` | Go to Trending  |

### Settings

| Key | Action                 |
| --- | ---------------------- |
| `d` | Toggle theme           |
| `w` | Toggle page width      |
| `x` | Toggle hide deprecated |
| `r` | Refresh data           |
| `?` | Show help              |

### List View

| Key              | Action               |
| ---------------- | -------------------- |
| `1` `2` `3`      | Filter type          |
| `[` / `]`        | Previous / Next page |
| `Shift+[`        | First page           |
| `↑↓←→` or `hjkl` | Navigate cards       |
| `Enter`          | Open package         |
| `f`              | Toggle favorite      |
| `t`              | Add tag              |

### Detail View

| Key | Action               |
| --- | -------------------- |
| `⌫` | Go back              |
| `f` | Toggle favorite      |
| `t` | Add tag              |
| `o` | Open homepage        |
| `c` | Copy install command |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/dofy/brew-graph.git
cd brew-graph

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## 📲 Install as App

Brew Graph is a Progressive Web App (PWA) that can be installed on your device:

- **Desktop (Chrome/Edge)**: Click the install icon in the address bar
- **iOS Safari**: Tap Share → "Add to Home Screen"
- **Android Chrome**: Tap menu → "Install app"

Once installed, the app works offline with cached data.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand
- **Local Database**: Dexie.js (IndexedDB)
- **Routing**: React Router 7
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa + Workbox

## 📦 Data Source

Package data is fetched from the official [Homebrew Formulae API](https://formulae.brew.sh/docs/api/).

## 🌐 Deployment

This project is configured for deployment on [Vercel](https://vercel.com). Simply connect your GitHub repository to Vercel for automatic deployments.

## 📄 License

MIT License © 2026 [Seven Yu](https://phpz.xyz)

---

**Powered by [yahaha.net](https://yahaha.net)** | **[phpz.xyz](https://phpz.xyz)**
