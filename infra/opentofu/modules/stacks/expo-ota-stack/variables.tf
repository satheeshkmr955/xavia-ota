variable "my_public_ssh_key" {
  type        = string
  description = "The public SSH key for production access"
}

variable "key_name" {
  type        = string
  description = "The name of the SSH key pair to use for the EC2 instance"
}

variable "sg_name" {
  type        = string
  description = "The name of the security group for the EC2 instance"
}

variable "resource_name" {
  type        = string
  description = "The base name for all resources in this stack"
}

variable "instance_name" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "root_volume_size" {
  type = number
}

variable "domain_name" {
  type = string
}

variable "top_domain_name" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "cloudfront_kvs_key" {
  type = string
}
