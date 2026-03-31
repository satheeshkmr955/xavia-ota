variable "domain_name" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "record_value" {
  type = string
}

variable "ttl" {
  type    = number
  default = 300
}

variable "cloudfront_domain_name" {
  type    = string
  default = ""
}
