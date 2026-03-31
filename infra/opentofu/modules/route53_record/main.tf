resource "aws_route53_record" "this" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = "${var.subdomain}.${data.aws_route53_zone.selected.name}"
  type    = "A"

  dynamic "alias" {
    for_each = var.cloudfront_domain_name != "" ? [1] : []
    content {
      name                   = var.cloudfront_domain_name
      zone_id                = "Z2FDTNDATAQYW2"
      evaluate_target_health = false
    }
  }

  records = var.cloudfront_domain_name == "" ? [var.record_value] : null
  ttl     = var.cloudfront_domain_name == "" ? var.ttl : null
}
