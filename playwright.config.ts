import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    // Browserless unit tests run once, in the `unit` project, not in every browser.
    testIgnore: '**/unit/**',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:4321',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'unit',
            testMatch: '**/unit/**/*.spec.ts',
            testIgnore: [],
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],
    webServer: [
        {
            command: 'pnpm astro dev --port 4321 --host 127.0.0.1',
            url: 'http://127.0.0.1:4321',
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
            stderr: 'pipe',
            stdout: 'ignore',
            env: {
                CI: 'true',
            },
        },
        {
            // Production build for tests/csp.spec.ts: `astro dev` does not apply the
            // Content-Security-Policy.
            command: 'pnpm astro build && pnpm astro preview --port 4322 --host 127.0.0.1',
            url: 'http://127.0.0.1:4322',
            reuseExistingServer: !process.env.CI,
            timeout: 180 * 1000,
            stderr: 'pipe',
            stdout: 'ignore',
            env: {
                CI: 'true',
            },
        },
    ],
});
