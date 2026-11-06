# The Cloudflare API token comes from CLOUDFLARE_API_TOKEN: a read-only token
# for plans on pull requests, and an edit token for applies from main (only
# available in the "infrastructure" GitHub environment).
provider "cloudflare" {}

variable "state_passphrase" {
  description = "Passphrase for client-side state encryption (TOFU_STATE_PASSPHRASE)."
  type        = string
  sensitive   = true
}

locals {
  # Not secret: both IDs appear in dashboard URLs and API responses.
  account_id = "9478ab7fe98bfec6eb4ca7824bfdc831"
  zone_id    = "075c02da46a0ad23d3e756e391978331"
}
