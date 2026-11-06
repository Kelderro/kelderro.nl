# Managed Transforms (Rules > Settings in the dashboard).
#
# The API only returns transforms that are enabled, so list only those here:
# any transform not listed is off. A disabled entry would show up as a change
# in every plan.
#
# Deliberately off: "add_security_headers". The security headers come from
# public/_headers (#154), and this transform added the obsolete
# X-XSS-Protection and Expect-CT headers.
resource "cloudflare_managed_transforms" "this" {
  zone_id = local.zone_id

  managed_request_headers = []

  managed_response_headers = [
    {
      # Pages doesn't send X-Powered-By, but removing it at the edge is harmless.
      id      = "remove_x-powered-by_header"
      enabled = true
    },
  ]
}
