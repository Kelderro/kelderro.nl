# The Cloudflare Pages project for the website.
#
# GitHub Actions builds, tests and deploys production (ci.yml). Pages' own
# production builds stay off: when Pages also deployed main, its untested
# build replaced the one CI had checked, without the analytics token.
#
# Pages still builds previews for every branch, as an independent check that
# the site builds in Cloudflare's build environment as well as on GitHub's
# runners. Those builds never reach production.
resource "cloudflare_pages_project" "website" {
  account_id        = local.account_id
  name              = "kelderro-nl"
  production_branch = "main"

  build_config = {
    build_caching   = false
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = ""
    # Pages' built-in Web Analytics is off; the site loads the beacon itself
    # (ADR 0002).
    web_analytics_tag = ""
  }

  source = {
    type = "github"
    config = {
      owner                          = "Kelderro"
      repo_name                      = "kelderro.nl"
      production_branch              = "main"
      production_deployments_enabled = false
      preview_deployment_setting     = "all"
    }
  }

  lifecycle {
    # deployment_configs (compatibility dates, the NODE_VERSION build variable,
    # fail_open) is managed in the dashboard, not here. Leaving it out of the
    # config isn't enough: the provider then proposes a value that differs from
    # state (env_vars is not computed, and nested defaults such as
    # fail_open = true replace the real values). The diff itself is hidden, but
    # it makes the provider mark every unset computed attribute as
    # "known after apply" (build_image_auto_upgrade, web_analytics_token, the
    # exclude lists), so every plan shows the project as changing.
    # Ignoring it keeps state's value in the proposal, so plans stay clean.
    # https://github.com/cloudflare/terraform-provider-cloudflare/issues/7449
    ignore_changes = [
      deployment_configs,
    ]
  }
}
