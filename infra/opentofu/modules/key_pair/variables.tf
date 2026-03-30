variable "key_name" {
  type        = string
  description = "The name for the AWS Key Pair"
}

variable "public_key" {
  type        = string
  description = "The actual public key string (e.g., contents of the .pub file)"
}

variable "custom_tags" {
  type        = map(string)
  description = "Additional tags for the key pair"
  default     = {}
}
