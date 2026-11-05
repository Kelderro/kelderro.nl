# 🚀 Portfolio & Business Website

[![Build Status](https://img.shields.io/github/actions/workflow/status/Kelderro/kelderro.nl/ci.yml?branch=main)](https://github.com/Kelderro/kelderro.nl/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/Kelderro/kelderro.nl)](LICENSE)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?logo=cloudflare)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Kelderro/kelderro.nl/badge)](https://scorecard.dev/viewer/?uri=github.com/Kelderro/kelderro.nl)

This is the portfolio and business website for my freelance technical consulting and principal engineering company. Built with [Astro](https://astro.build), it showcases my experience, skills, and services.

## ✨ Features

- Modern, fast, and SEO-friendly static site using Astro
- Content-driven: MDX for engagements
- Responsive design and custom components
- Cloudflare Pages deployment for global speed and reliability
- Sentry integration for production error monitoring
- Spotlight integration for local development debugging
- DevContainer support for consistent development environments

## 🛠️ Development & Usage

### Prerequisites

- [pnpm](https://pnpm.io/) (recommended)
- [Docker](https://www.docker.com/), [Podman](https://podman.io/), or any compatible container runtime (for DevContainer)

### 🧪 Automated Testing

End-to-end and integration tests are written with [Playwright](https://playwright.dev/).

- Test files are located in the `tests/` directory.
- To run tests:
    ```sh
    pnpm test
    ```

### 📝 License

**Code (Technical Aspects):**
All code in this repository is licensed under the MIT License. You are free to use, modify, and reuse any technical or code aspects of this project, including for commercial purposes.

**Content (Text, Images, Portfolio Items):**
All written content, images, and portfolio items are licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) license. You may not copy the content one-to-one or use it for commercial purposes, but you may take inspiration for your own projects.

See the [LICENSE](LICENSE) file for full details.

### Getting Started (with DevContainer)

1. Open the project in VS Code and reopen in DevContainer when prompted.
2. Install dependencies:
    ```sh
    pnpm install
    ```
3. Start the local development server:
    ```sh
    pnpm run dev
    ```
4. Visit the local site at the URL shown in the terminal (e.g., http://localhost:4321).

### Running Locally (without DevContainer)

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Run `pnpm run dev`

### Build for Production

```
pnpm run build
```

### Preview Production Build

```
pnpm run preview
```

## 🏗️ Architecture

- **Astro**: Static site generator for fast, modern web apps
- **MDX Content**: All engagement content is written in MDX files under `src/content/`
- **Cloudflare Pages**: Deployed globally for speed and reliability
- **Sentry**: Enabled in production for error monitoring
- **Spotlight**: Enabled in development for in-browser debugging
- **DevContainer**: Ensures consistent, reproducible development environments

## 🌐 Deployment

The site is automatically deployed to Cloudflare Pages on push to the main branch.

## Credits

- Based on the [Astro Starter Kit: Portfolio](https://github.com/withastro/astro/tree/latest/examples/portfolio)
