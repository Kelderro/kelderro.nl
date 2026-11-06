# Response header Transform Rules (Rules > Transform Rules in the dashboard).
#
# kelderro.nl itself gets its security headers from public/_headers (#154).
# This rule covers every other hostname in the zone, such as the www redirect
# and the other proxied subdomains, which aren't served by Pages. The values
# are the ones the dashboard rule had when it was imported.
resource "cloudflare_ruleset" "response_headers" {
  zone_id = local.zone_id
  name    = "default"
  kind    = "zone"
  phase   = "http_response_headers_transform"

  rules = [
    {
      description = "Security headers"
      enabled     = true
      expression  = "(http.host ne \"kelderro.nl\")"
      action      = "rewrite"
      action_parameters = {
        headers = {
          "Access-Control-Allow-Origin" = {
            operation = "set"
            value     = "kelderro.nl"
          }
          "Content-Security-Policy" = {
            operation = "set"
            value     = "default-src 'self'; style-src 'unsafe-inline' 'self'; script-src 'self' 'unsafe-inline';"
          }
          "Permissions-Policy" = {
            operation = "set"
            value     = "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()"
          }
          "Referrer-Policy" = {
            operation = "set"
            value     = "no-referrer"
          }
          "Strict-Transport-Security" = {
            operation = "set"
            value     = "max-age=63072000; includeSubDomains; preload"
          }
          "X-Content-Type-Options" = {
            operation = "set"
            value     = "nosniff"
          }
          "X-Frame-Options" = {
            operation = "set"
            value     = "DENY"
          }
          "X-XSS-Protection" = {
            operation = "set"
            value     = "1; mode=block"
          }
        }
      }
    },
  ]
}
