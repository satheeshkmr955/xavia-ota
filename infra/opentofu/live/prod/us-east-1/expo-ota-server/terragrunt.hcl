include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../../modules//stacks/expo-ota-stack"
}

inputs = {
  # Security
  my_public_ssh_key = file("~/.ssh/id_ed25519_opentofu.pub")
  key_name          = "expo-ota-prod"
  sg_name           = "expo-ota"
  resource_name     = "expo-ota"
  
  # Instance Config
  instance_name    = "Expo-OTA-Server"
  instance_type    = "t2.small"
  root_volume_size = 20
  
  # Networking & DNS
  top_domain_name = "satheeshkmr955.click"
  subdomain       = "expo-updates"
  domain_name     = "expo-updates.satheeshkmr955.click"
  
  # Storage
  bucket_name = "xavia-smartoptions"

  # CloudFront CDN
  cloudfront_kvs_key = "ROLLOUT_PERCENTAGE"
}