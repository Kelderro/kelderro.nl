# Adopt existing dashboard configuration instead of recreating it. After the
# apply that imports them, these blocks are no-ops and can be removed in a
# later change. The zone settings and Managed Transforms were imported in #174.

import {
  to = cloudflare_ruleset.response_headers
  id = "zones/${local.zone_id}/9c33ece0c6e7492c91bb74b7f6550bf0"
}

import {
  to = cloudflare_pages_project.website
  id = "${local.account_id}/kelderro-nl"
}
