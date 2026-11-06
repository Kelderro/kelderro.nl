# Zone settings for kelderro.nl. Values match the dashboard when they were
# brought under code (November 2026), except where a comment says otherwise.

locals {
  zone_settings = {
    # Off: it defers the blocking theme script in <head>, so dark-mode visitors
    # saw the light theme first (#173). Astro ships little, deferred JS anyway.
    rocket_loader = "off"

    # Cloudflare obfuscates email addresses in the HTML against scrapers. Works
    # with the current CSP.
    email_obfuscation = "on"

    always_use_https = "on"
    ssl              = "strict"
    min_tls_version  = "1.2"
  }
}

resource "cloudflare_zone_setting" "this" {
  for_each = local.zone_settings

  zone_id    = local.zone_id
  setting_id = each.key
  value      = each.value
}

# HSTS is sent by Cloudflare Pages from public/_headers (2 years, preload), not
# by the edge setting, so it stays disabled here to keep a single source.
resource "cloudflare_zone_setting" "security_header" {
  zone_id    = local.zone_id
  setting_id = "security_header"
  value = {
    strict_transport_security = {
      enabled            = false
      include_subdomains = true
      max_age            = 15552000
      nosniff            = true
      preload            = true
    }
  }
}
