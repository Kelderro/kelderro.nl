# Adopt existing dashboard configuration instead of recreating it. After the
# apply that imports them, these blocks are no-ops and can be removed in a
# later change. Earlier imports: the zone settings and Managed Transforms
# (#174), the response header rule and the Pages project (#177).

locals {
  # Dashboard IDs of the existing DNS records (dns.tf).
  dns_record_ids = {
    apex       = "26c7d4e0c790df53557e830116294962"
    wildcard   = "74fc2b9c60e24ba611fc277dfbd6c0b1"
    mx_primary = "75508ec7b1d9aad0f7bbea9abc65192b"
    mx_alt1    = "28984367ed595a24f3ad3f0bdfc4106d"
    mx_alt2    = "47e63f8fcb2868975c63ef1a2b035a0a"
    mx_alt3    = "7cd2f405a847fbfedbdfcc66e49f8a12"
    mx_alt4    = "7c16b753b1a11fcda58d8a68f19a2bff"
    spf        = "95113b8a211221a0964bc757554213c3"
    dkim       = "38613c5fdc957c7e0ba1f6df3f16db77"
    dmarc      = "3b7142b96370f4fd3c5a0da24a1c4577"
  }
}

import {
  for_each = local.dns_record_ids
  to       = cloudflare_dns_record.this[each.key]
  id       = "${local.zone_id}/${each.value}"
}

import {
  to = cloudflare_dns_record.caa
  id = "${local.zone_id}/7e842d44cff687c17f76e50d498e21a7"
}

import {
  to = cloudflare_ruleset.redirects
  id = "zones/${local.zone_id}/1b11465312b04da68e23a069e7e4e5a8"
}
