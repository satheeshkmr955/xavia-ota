# Create the SSH Key Pair
module "ssh_key" {
  source     = "../../key_pair"
  key_name   = "${var.key_name}-key"
  public_key = var.my_public_ssh_key
}

# Define Security Group Rules
module "ota_sg" {
  source        = "../../sg"
  sg_name       = "${var.sg_name}-sg"
  resource_name = "${var.resource_name}-security-group"
  vpc_id        = data.aws_vpc.default.id

  ingress_rules = [
    {
      from_port   = 22,
      to_port     = 22,
      protocol    = "tcp",
      cidr_blocks = ["${chomp(data.http.my_ip.response_body)}/32"],
      description = "SSH from my current IP"
    },
    {
      from_port       = 80,
      to_port         = 80,
      protocol        = "tcp",
      prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
      description     = "HTTP",
    },
    {
      from_port       = 443,
      to_port         = 443,
      protocol        = "tcp",
      prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
      description     = "HTTPS",
    }
  ]
}

module "ecr_iam" {
  source = "../../ec2_iam_role"
}

# Provision the EC2 Instance
module "ota_server" {
  source                 = "../../ec2"
  instance_name          = var.instance_name
  instance_type          = var.instance_type
  root_volume_size       = var.root_volume_size
  key_name               = module.ssh_key.key_name
  vpc_security_group_ids = [module.ota_sg.security_group_id]
  iam_instance_profile   = module.ecr_iam.ota_instance_profile_name
}

# Assign an Elastic IP
module "server_eip" {
  source        = "../../eip"
  resource_name = "${var.resource_name}-eip"
  igw_id        = data.aws_internet_gateway.default.id
}

# Associate EIP with Instance
resource "aws_eip_association" "eip_assoc" {
  instance_id   = module.ota_server.instance_ids[0]
  allocation_id = module.server_eip.allocation_id
}

# CDN for OTA updates
module "expo_cdn" {
  source             = "../../cdn"
  domain_name        = var.domain_name
  top_domain_name    = var.top_domain_name
  origin_domain      = module.ota_server.public_dns
  cloudfront_kvs_key = var.cloudfront_kvs_key
}

# Create Route53 Record
module "route53_record" {
  source                 = "../../route53_record"
  domain_name            = var.top_domain_name
  subdomain              = var.subdomain
  cloudfront_domain_name = module.expo_cdn.cloudfront_domain_name
  record_value           = ""
}

# Create S3 Bucket for OTA Updates
module "ota_s3_bucket" {
  source      = "../../s3"
  bucket_name = var.bucket_name
  tags = {
    Name = var.bucket_name
  }
}
