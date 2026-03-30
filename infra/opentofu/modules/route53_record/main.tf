resource "aws_route53_record" "this" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = "${var.subdomain}.${data.aws_route53_zone.selected.name}"
  type    = "A"
  ttl     = var.ttl
  records = [var.record_value]
}
