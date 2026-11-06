# The Cloudflare Pages project for the website.
#
# GitHub Actions builds, tests and deploys every commit (ci.yml). The Pages Git
# integration stays connected, but builds nothing itself: when it also
# deployed main, its untested build replaced the one CI had checked, without
# the analytics token. Preview builds are off for the same reason.
resource "cloudflare_pages_project" "website" {
  account_id        = local.account_id
  name              = "kelderro-nl"
  production_branch = "main"

  build_config = {
    build_caching   = false
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = ""
  }

  source = {
    type = "github"
    config = {
      owner                          = "Kelderro"
      repo_name                      = "kelderro.nl"
      production_branch              = "main"
      production_deployments_enabled = false
      # Changed from "all": only CI deploys previews.
      preview_deployment_setting = "none"
    }
  }
}
