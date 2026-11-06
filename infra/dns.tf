# DNS records for the website and email. Values match the dashboard when they
# were brought under code (November 2026).
#
# Homelab records (internal hosts, VPN, monitoring) deliberately stay out of
# this public repository and are still managed in the dashboard. OpenTofu only
# manages the records listed here, so it leaves the others alone.
#
# A ttl of 1 means "automatic" (required for proxied records).

locals {
  website_dns_records = {
    # The site itself, served by Cloudflare Pages (pages.tf).
    apex = {
      type    = "CNAME"
      name    = "kelderro.nl"
      content = "website-kelderro-nl.pages.dev"
      proxied = true
      ttl     = 1
    }
    # Every other hostname, such as www, goes through the Cloudflare proxy, so
    # the redirect and the response header rule (response_headers.tf) apply.
    wildcard = {
      type    = "CNAME"
      name    = "*.kelderro.nl"
      content = "kelderro.nl"
      proxied = true
      ttl     = 1
    }
  }

  # Google Workspace mail.
  email_dns_records = {
    mx_primary = {
      type     = "MX"
      name     = "kelderro.nl"
      content  = "aspmx.l.google.com"
      priority = 1
      ttl      = 3600
    }
    mx_alt1 = {
      type     = "MX"
      name     = "kelderro.nl"
      content  = "alt1.aspmx.l.google.com"
      priority = 5
      ttl      = 3600
    }
    mx_alt2 = {
      type     = "MX"
      name     = "kelderro.nl"
      content  = "alt2.aspmx.l.google.com"
      priority = 5
      ttl      = 3600
    }
    mx_alt3 = {
      type     = "MX"
      name     = "kelderro.nl"
      content  = "alt3.aspmx.l.google.com"
      priority = 10
      ttl      = 3600
    }
    mx_alt4 = {
      type     = "MX"
      name     = "kelderro.nl"
      content  = "alt4.aspmx.l.google.com"
      priority = 10
      ttl      = 3600
    }
    spf = {
      type    = "TXT"
      name    = "kelderro.nl"
      content = "v=spf1 include:_spf.google.com -all"
      ttl     = 3600
    }
    dkim = {
      type    = "TXT"
      name    = "google._domainkey.kelderro.nl"
      content = "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArsSGy+WYi8KyV/Wkzc/5K0D5SV5CB7z8qIFO0iOTO3UBDV0sajNLuM+ffuEHYjICOqNKBZqGItCSgdyYe11/zowWED+DQGfw3N17O2ktlpmS00Vd8vpkmzWwZ7pPzShWTSiPFwcOmy74y6GToQssWp/wn80y6oMKumwv2NkRnGiWcBJjQsTUyt41rmgXt6UjxTVGPDI4UBawiUh7kliPFr6mI/lmLoTzYTXU87j0ra+AT7CdTqLoISMOicMk2uTqsTI17hzDU8EcSVel3Cf/qy3vdIW3IzQQUFJoQv8g5hkmAo8t5ga8p+JcvGWdys1zEdU0xvRWxFSPvYxfQ8jSDwIDAQAB"
      ttl     = 3600
    }
    # Reports go to Cloudflare's DMARC Management.
    dmarc = {
      type    = "TXT"
      name    = "_dmarc.kelderro.nl"
      content = "v=DMARC1;  p=none; rua=mailto:3cba655b8a5841809f58b4d5bc6c5381@dmarc-reports.cloudflare.net"
      ttl     = 1
    }
  }

  dns_records = merge(local.website_dns_records, local.email_dns_records)
}

resource "cloudflare_dns_record" "this" {
  for_each = local.dns_records

  zone_id  = local.zone_id
  type     = each.value.type
  name     = each.value.name
  content  = each.value.content
  ttl      = each.value.ttl
  proxied  = try(each.value.proxied, false)
  priority = try(each.value.priority, null)
}

# Only Let's Encrypt may issue certificates for the zone. Cloudflare adds the
# CAA records for its own edge certificate authorities automatically.
resource "cloudflare_dns_record" "caa" {
  zone_id = local.zone_id
  type    = "CAA"
  name    = "kelderro.nl"
  ttl     = 3600
  data = {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }
}
