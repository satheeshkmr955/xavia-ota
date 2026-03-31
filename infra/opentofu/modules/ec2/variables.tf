variable "instance_count" {
  type    = number
  default = 1
}
variable "instance_type" {
  type    = string
  default = "t2.micro"
}
variable "associate_public_ip" {
  type    = bool
  default = true
}
variable "key_name" {
  type = string
}
variable "vpc_security_group_ids" {
  type = list(string)
}
variable "instance_name" {
  type    = string
  default = "ExpoUpdateOpenTofu"
}
variable "custom_tags" {
  type    = map(string)
  default = {}
}
variable "root_volume_size" {
  type        = number
  description = "The size of the root volume in GB"
  default     = 8
}
variable "iam_instance_profile" {
  description = "The name of the IAM instance profile to associate with the instance"
  type        = string
  default     = null
}
variable "metadata_http_put_response_hop_limit" {
  description = "The desired HTTP PUT response hop limit for instance metadata requests (set to 2 for Docker/Containers)"
  type        = number
  default     = 2
}
