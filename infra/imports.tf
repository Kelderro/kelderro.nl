# Adopt the existing dashboard configuration instead of recreating it. Once the
# first apply has imported these, the blocks are no-ops and can be removed.

import {
  for_each = local.zone_settings
  to       = cloudflare_zone_setting.this[each.key]
  id       = "${local.zone_id}/${each.key}"
}

import {
  to = cloudflare_zone_setting.security_header
  id = "${local.zone_id}/security_header"
}

import {
  to = cloudflare_managed_transforms.this
  id = local.zone_id
}
