# Brew Graph

🍺 A modern web application to search, explore and manage Homebrew packages.

![Version](https://img.shields.io/github/package-json/v/dofy/brew-graph?style=flat&color=blue)
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

## 🔍 Search Syntax

| Syntax   | Description                    | Example       |
| -------- | ------------------------------ | ------------- |
| `text`   | Search by name and description | `react`       |
| `#tag`   | Filter by tag                  | `#frontend`   |
| `*`      | Show only favorites            | `*`           |
| Combined | Combine multiple filters       | `react #tool` |
| Combined | Search favorites with text     | `* node`      |

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

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand
- **Local Database**: Dexie.js (IndexedDB)
- **Routing**: React Router 7
- **Icons**: Lucide React

## 📦 Data Source

Package data is fetched from the official [Homebrew Formulae API](https://formulae.brew.sh/docs/api/).

## 🌐 Deployment

This project is configured for deployment on [Vercel](https://vercel.com). Simply connect your GitHub repository to Vercel for automatic deployments.

## 📄 License

MIT License © 2026 [Seven Yu](https://phpz.xyz)

---

**Powered by [yahaha.net](https://yahaha.net)** | **[phpz.xyz](https://phpz.xyz)**
