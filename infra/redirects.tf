# Single Redirect rules (Rules > Redirect Rules in the dashboard).
#
# Every hostname other than kelderro.nl, such as www and any other name the
# proxied wildcard record catches, redirects to the apex. Requests from the
# server and from home are exempt, so subdomains served there stay reachable.
# The values are the ones the dashboard rule had when it was imported.
resource "cloudflare_ruleset" "redirects" {
  zone_id     = local.zone_id
  name        = "redirects"
  description = "Redirect ruleset"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules = [
    {
      description = "Redirect to Kelderro.nl"
      enabled     = true
      expression  = "(not ip.src in {${join(" ", var.redirect_bypass_ips)}} and not http.host in {\"kelderro.nl\"})"
      action      = "redirect"
      action_parameters = {
        from_value = {
          status_code           = 302
          preserve_query_string = false
          target_url = {
            value = "https://kelderro.nl"
          }
        }
      }
    },
  ]
}

# The exempt addresses are personal (the server and home), and this repository
# and its plan comments are public. They come from the TOFU_REDIRECT_BYPASS_IPS
# secret, as a JSON list such as ["192.0.2.1", "198.51.100.2"], in the order
# the dashboard rule has them. Because the variable is sensitive, plans show
# the rule's expression as (sensitive value).
variable "redirect_bypass_ips" {
  description = "IP addresses exempt from the redirect to the apex (TOFU_REDIRECT_BYPASS_IPS)."
  type        = list(string)
  sensitive   = true
}
