terraform {
  required_version = "~> 1.13"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.28"
    }
  }

  # State lives in a Cloudflare R2 bucket in the EU jurisdiction (S3-compatible
  # API). Credentials come from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY,
  # which hold the bucket-scoped R2 token. Locking uses a lock file in the same
  # bucket (conditional writes), so no separate lock table is needed.
  backend "s3" {
    bucket = "kelderro-nl-tofu-state"
    key    = "kelderro-nl/terraform.tfstate"
    region = "auto"

    endpoints = {
      s3 = "https://9478ab7fe98bfec6eb4ca7824bfdc831.eu.r2.cloudflarestorage.com"
    }

    use_path_style              = true
    use_lockfile                = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }

  # Client-side encryption (ADR 0003): state and plan files are encrypted with
  # AES-GCM before they leave the runner, using a key derived from the
  # TOFU_STATE_PASSPHRASE secret. Unencrypted state is refused.
  encryption {
    key_provider "pbkdf2" "state" {
      passphrase = var.state_passphrase
    }

    method "aes_gcm" "state" {
      keys = key_provider.pbkdf2.state
    }

    state {
      method   = method.aes_gcm.state
      enforced = true
    }

    plan {
      method   = method.aes_gcm.state
      enforced = true
    }
  }
}
