output "cloudfront_distribution_id" {
  value = module.expo_cdn.cloudfront_distribution_id
}

output "cloudfront_kvs_arn" {
  value = module.expo_cdn.cloudfront_kvs_arn
}

output "cloudfront_origin_verify_key" {
  value     = module.expo_cdn.cloudfront_origin_verify_key
  sensitive = true
}

output "public_ip" {
  description = "The actual public EIP address"
  value       = module.server_eip.public_ip
}