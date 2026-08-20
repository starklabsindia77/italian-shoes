# Terraform and provider pins.
#
# State backend: S3, commented out until the bucket exists.
# Bucket creation commands are in infra/README.md — create the bucket,
# uncomment this block, then run `terraform init -migrate-state`.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # backend "s3" {
  #   bucket       = "italian-shoes-tfstate-<ACCOUNT_ID>"
  #   key          = "production/terraform.tfstate"
  #   region       = "ap-south-1"
  #   encrypt      = true
  #   use_lockfile = true # S3-native locking (Terraform >= 1.10); use a DynamoDB table on older versions
  # }
}

provider "aws" {
  region = var.aws_region

  # Every resource created by this configuration carries these tags.
  # The Name tag on the app instance is additionally load-bearing:
  # the GitHub deploy role may only SendCommand to instances tagged with it.
  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}
