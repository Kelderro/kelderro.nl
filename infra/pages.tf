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
}
