// Inlined in the head (MainHead.astro) so dark mode is instant and blocking.
// astro.config.mjs hashes this file for the Content-Security-Policy.
const getThemePreference = () => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme');
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
const isDark = getThemePreference() === 'dark';
document.documentElement.classList[isDark ? 'add' : 'remove']('theme-dark');
// The preference is only stored when the visitor clicks the theme toggle
// (ThemeToggle.astro), never automatically. See ADR 0002.
