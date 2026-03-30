terraform_binary = "tofu"

locals {
  # 1. Attempt to load env.hcl from the child directory
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl", "empty.hcl"), { locals = {} })
  
  aws_region = "us-east-1"
  profile    = "expo-update-opentofu"
  
  # 2. Define the Base Tags
  base_tags = {
    Owner       = "DevOps-Team"
    ManagedBy   = "Terragrunt"
    Project     = "Expo-Update"
    TofuVersion = "1.11.5"
  }

  # 3. Merge: Global Defaults -> Default "Prod" -> Environment Overrides
  common_tags = merge(
    local.base_tags,
    { Environment = "Prod" },
    local.env_vars.locals
  )
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region  = "${local.aws_region}"
  profile = "${local.profile}"

  default_tags {
    tags = ${jsonencode(local.common_tags)}
  }
}
EOF
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "expo-update-opentofu-tfstate-${local.aws_region}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "expo-update-opentofu-lock-table"
    profile        = "${local.profile}"
    s3_bucket_tags      = local.common_tags
    dynamodb_table_tags = local.common_tags
  }
}