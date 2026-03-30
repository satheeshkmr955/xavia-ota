variable "resource_name" {
  type        = string
  description = "The full name to apply to the Name tag"
}

variable "igw_id" {
  type        = any
  description = "The ID of the Internet Gateway to depend on"
  default     = null
}

variable "custom_tags" {
  type        = map(string)
  description = "Additional tags to apply to the EIP"
  default     = {}
}