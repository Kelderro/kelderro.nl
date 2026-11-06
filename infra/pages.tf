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
    # Optional fields that are unset in the dashboard (null) but that the
    # provider treats as computed. Without this, every plan shows the project
    # as changing. None of them are used.
    ignore_changes = [
      build_config.web_analytics_token,
      source.config.path_excludes,
      source.config.preview_branch_excludes,
    ]
  }
}
