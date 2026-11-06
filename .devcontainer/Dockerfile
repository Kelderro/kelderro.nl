# Pinned by digest; Dependabot (docker ecosystem) keeps it up to date.
FROM mcr.microsoft.com/devcontainers/javascript-node:24@sha256:2015e2c863cb1e608bc0876860dd063cdb9e3d9a02dca63d1c2fce8fad02d088

# 1. Enable Corepack. Fetch version defined in package.json
RUN corepack enable

# Pre-create the pnpm directories and set ownership
RUN mkdir -p /home/node/.local/share/pnpm && chown -R node:node /home/node/.local/share/pnpm

# 2. Set the pnpm store directory
USER node
RUN pnpm config set store-dir /home/node/.local/share/pnpm/store

# 3. Install browser dependencies for Playwright
USER root
RUN npx playwright install-deps
USER node