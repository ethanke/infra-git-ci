# Terraform and Provider Versions
# infra-git-ci: State-of-the-art GitOps infrastructure for lum.tools

terraform {
  required_version = ">= 1.8.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = ">= 1.51.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.5.0"
    }
    remote = {
      source  = "tenstad/remote"
      version = ">= 0.1.3"
    }
  }

  # Terraform Cloud backend for state management
  # Uncomment after creating workspace in Terraform Cloud
  # cloud {
  #   organization = "lum-tools"
  #   workspaces {
  #     name = "infra-git-ci-production"
  #   }
  # }
}

provider "hcloud" {
  token = var.hcloud_token
}
