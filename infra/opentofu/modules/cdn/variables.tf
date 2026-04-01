locals {
  # Result: "origin-expo-updates-satheeshkmr955-click"
  generated_origin_id = "origin-${replace(var.domain_name, ".", "-")}"
}

variable "top_domain_name" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "origin_domain" {
  type = string
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_100, PriceClass_200, PriceClass_All)"
  type        = string
  default     = "PriceClass_All"
}

variable "whitelist_headers" {
  description = "List of headers to include in the cache key"
  type        = list(string)
  default = [
    "x-rollout-bucket",
    "expo-api-version",
    "expo-runtime-version",
    "expo-protocol-version",
    "expo-platform",
    "expo-channel-name",
    "expo-current-update-id",
    "expo-updates-environment"
  ]
}

variable "origin_whitelist_headers" {
  description = "Headers to forward to the origin (Traefik) without including them in the cache key"
  type        = list(string)
  default = [
    "Host",
    "eas-client-id",
    "expo-expect-signature",
    "expo-embedded-update-id",
    "if-none-match",
    "expo-json-error"
  ]
}

variable "assets_query" {
  description = "List of Query to include in the cache key"
  type        = list(string)
  default     = ["asset", "runtimeVersion", "platform"]
}
