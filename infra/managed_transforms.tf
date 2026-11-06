# Managed Transforms (Rules > Settings in the dashboard).
resource "cloudflare_managed_transforms" "this" {
  zone_id = local.zone_id

  managed_request_headers = []

  managed_response_headers = [
    {
      # Pages doesn't send X-Powered-By, but removing it at the edge is harmless.
      id      = "remove_x-powered-by_header"
      enabled = true
    },
    {
      # Off: the security headers come from public/_headers (#154). This
      # transform added the obsolete X-XSS-Protection and Expect-CT headers.
      id      = "add_security_headers"
      enabled = false
    },
  ]
}
