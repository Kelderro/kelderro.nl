# 2. Cookieless analytics without a consent banner

- Status: Accepted
- Date: 2026-11-05
- Issue: [#159](https://github.com/Kelderro/kelderro.nl/issues/159)

## Context

Lighthouse in CI measures performance in a lab, on a single simulated device. I also want to know how real visitors experience the site (real-user Core Web Vitals) and which pages are visited. At the same time, the site must comply with the GDPR and the Dutch cookie rules (Telecommunicatiewet, article 11.7a, which implements article 5(3) of the ePrivacy Directive), without a consent banner. A banner hurts the first impression, and asking for consent to track visitors is at odds with how I want to work.

The rules that matter:

- **Cookie rules (ePrivacy 5(3), Tw 11.7a).** Consent is needed to store information on, or read information from, a visitor's device, unless it's strictly necessary for a service the visitor explicitly asked for. The Netherlands also exempts analytics with little or no impact on privacy. The Dutch Data Protection Authority (Autoriteit Persoonsgegevens) attaches conditions to that exemption: a processing agreement, no sharing of data with third parties for their own purposes, and informing visitors. The EDPB guidelines 2/2023 interpret "storing or reading" broadly, so a script that reads device information can count, even without cookies.
- **GDPR.** Even without cookies, processing an IP address is processing personal data. It needs a legal basis (here, legitimate interest under article 6(1)(f)), a processing agreement with the processor, a lawful basis for transfers outside the EEA, and a privacy statement (articles 13 and 14).

Before this decision the site already set no cookies and loaded no third-party resources. However, the theme script wrote the theme to `localStorage` on every page load, even when the visitor never touched the theme switch. There was also no privacy statement.

## Decision

1. **Cloudflare Web Analytics, loaded only in production builds and only when configured.** The beacon is added when the `CF_WEB_ANALYTICS_TOKEN` repository variable is set, and only for builds from `main`, so preview deployments and local development load nothing. Cloudflare Web Analytics:
    - uses no cookies, `localStorage` or other client-side state,
    - doesn't fingerprint visitors or recognise them across visits or sites,
    - only reports aggregated data (page views, referrer, browser and device type, country and Core Web Vitals).

    Cloudflare already hosts the site and sees every request, so this adds **no new processor or recipient** of visitor data. This keeps the analytics within the Dutch exemption for analytics with little privacy impact. The privacy statement informs visitors, as the Dutch exemption requires.

2. **The theme preference is stored only when the visitor clicks the theme switch.** A preference the visitor sets themselves is a service they explicitly asked for, so it needs no consent. Writing it automatically on every page load didn't clearly qualify.

3. **A privacy statement at `/privacy/`**, linked from the footer. It covers the controller, hosting, analytics, theme storage, offline cache, email contact, international transfers and visitor rights.

4. **Regression guards.**
    - `tests/privacy.spec.ts` fails when a page sets cookies or web storage, or makes third-party requests, without any visitor interaction. It also checks that the theme is only stored after a click.
    - The Lighthouse budget `resource-summary:third-party:count` allows at most two third-party requests in production (the beacon script and its report). Adding any other tracker or embed fails CI. _Update 2026-11-06: raised to three, because the report also triggers a CORS preflight request to the same host._

## Consequences

**Good**

- No consent banner, and no tracking that visitors would need to consent to.
- Real-user Core Web Vitals and page views, without a new third party.
- Privacy is enforced by tests and CI, not only promised in a statement.

**Bad**

- Analytics without identifiers can't show unique visitors, returning visitors or user journeys. That's an accepted limit.
- The production CSP must allow the beacon. `script-src` needs `https://static.cloudflareinsights.com` and `connect-src` needs `https://cloudflareinsights.com`. The headers are currently managed in the Cloudflare dashboard (see #154), so this is a manual step before setting the token. _Update 2026-11-05: the headers now live in `public/_headers` (#154), which allows the beacon in the CSP. The only manual step left is disabling the dashboard header rules._
- Some data is processed outside the EEA. This relies on Cloudflare's data processing agreement, the EU–US Data Privacy Framework and the Standard Contractual Clauses.
- **Service worker cache (accepted risk).** For offline support, the service worker stores the site's own public pages and assets in Cache Storage. That is storage on the device without explicit consent. It contains no identifiers, is never read back to recognise anyone, and functions like the browser's HTTP cache. I consider this low-risk and disclose it in the privacy statement, but under a strict reading of the EDPB guidelines it's a grey area.
- **This is not legal advice.** The reasoning reflects my understanding of the rules as of November 2026. A privacy lawyer should review it if the site starts processing more data, for example through a contact form.

## Alternatives considered

- **Google Analytics or similar:** uses cookies and shares data with the provider for its own purposes, so it needs consent and a banner. Rejected.
- **Self-hosted Plausible, Umami or Matomo (cookieless):** also banner-free, but needs a server or a paid service, and that's a new processor. Cloudflare is already the processor for hosting.
- **Own real-user monitoring endpoint** (the `web-vitals` library plus a Pages Function writing to Workers Analytics Engine): entirely first-party, but more code to build and maintain for little extra value.
- **Lighthouse only (no real-user monitoring):** nothing to disclose, but it only shows lab data.
