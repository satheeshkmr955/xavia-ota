output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.expo_cdn.domain_name
}

output "cloudfront_kvs_arn" {
  value = aws_cloudfront_key_value_store.rollout_kv.arn
}

output "cloudfront_origin_verify_key" {
  value     = random_password.origin_secret.result
  sensitive = true
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.expo_cdn.id
}
