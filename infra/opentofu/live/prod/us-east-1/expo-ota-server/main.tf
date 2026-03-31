# Create the SSH Key Pair
module "ssh_key" {
  source     = "../../../../modules/key_pair"
  key_name   = "expo-ota-prod-key"
  public_key = var.my_public_ssh_key
}

# Define Security Group Rules
module "ota_sg" {
  source        = "../../../../modules/sg"
  sg_name       = "expo-ota-sg"
  resource_name = "expo-ota-security-group"
  vpc_id        = data.aws_vpc.default.id

  ingress_rules = [
    { from_port = 22, to_port = 22, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"], description = "SSH" },
    { from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"], description = "HTTP" },
    { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"], description = "HTTPS" }
  ]
}

module "ecr_iam" {
  source = "../../../../modules/ec2_iam_role"
}

# Provision the EC2 Instance
module "ota_server" {
  source                 = "../../../../modules/ec2"
  instance_name          = "Expo-OTA-Server"
  instance_type          = "t2.small"
  root_volume_size       = 20
  key_name               = module.ssh_key.key_name
  vpc_security_group_ids = [module.ota_sg.security_group_id]
  iam_instance_profile   = module.ecr_iam.ota_instance_profile_name
}

# Assign an Elastic IP
module "server_eip" {
  source        = "../../../../modules/eip"
  resource_name = "expo-ota-eip"
  igw_id        = data.aws_internet_gateway.default.id
}

# Associate EIP with Instance
resource "aws_eip_association" "eip_assoc" {
  instance_id   = module.ota_server.instance_ids[0]
  allocation_id = module.server_eip.allocation_id
}

# CDN for OTA updates
module "expo_cdn" {
  source          = "../../../../modules/cdn"
  domain_name     = "expo-updates.satheeshkmr955.click"
  top_domain_name = "satheeshkmr955.click"
  origin_domain   = module.ota_server.public_dns
}

# Create Route53 Record
module "route53_record" {
  source                 = "../../../../modules/route53_record"
  domain_name            = "satheeshkmr955.click"
  subdomain              = "expo-updates"
  cloudfront_domain_name = module.expo_cdn.cloudfront_domain_name
  record_value           = ""
}

# Create S3 Bucket for OTA Updates
module "ota_s3_bucket" {
  source      = "../../../../modules/s3"
  bucket_name = "xavia-smartoptions"
  tags = {
    Name = "xavia-smartoptions"
  }
}
