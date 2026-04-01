# ACM Certificate (Must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# This resource creates the DNS records in Route53
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.selected.zone_id
}

# THE WAITER: This is the magic piece. 
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CloudFront Function (JavaScript 2.0)
resource "aws_cloudfront_function" "rollout_hash" {
  name    = "${replace(var.domain_name, ".", "-")}-rollout-hashing"
  runtime = "cloudfront-js-2.0"
  comment = "Calculates x-rollout-bucket based on eas-client-id for ${var.domain_name}"
  publish = true
  code    = <<EOF
function handler(event) {
    var request = event.request;
    var headers = request.headers;

    var deviceId = 'anonymous';
    if (headers['eas-client-id'] && headers['eas-client-id'].value) {
        deviceId = headers['eas-client-id'].value;
    }

    var hash = 0;
    for (var i = 0; i < deviceId.length; i++) {
        hash = (hash << 5) - hash + deviceId.charCodeAt(i);
        hash |= 0;
    }
    var bucket = Math.abs(hash) % 100;
    var bucketString = bucket.toString();

    request.headers['x-rollout-bucket'] = { value: bucketString };

    return request;
}
EOF
}

# New Origin Request Policy (For Forwarding only)
resource "aws_cloudfront_origin_request_policy" "forward_host" {
  name    = "${replace(var.domain_name, ".", "-")}-forward-host"
  comment = "Forwards Host header to Traefik without caching it"

  cookies_config {
    cookie_behavior = "none"
  }

  query_strings_config {
    query_string_behavior = "all"
  }

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = var.origin_whitelist_headers
    }
  }
}

# Custom Cache Policy (Gzip + Brotli + Expo Headers)
resource "aws_cloudfront_cache_policy" "expo_custom_policy" {
  name        = "${replace(var.domain_name, ".", "-")}-cache-policy"
  comment     = "Dynamic cache policy for ${var.domain_name}"
  default_ttl = 21600 # 6 hours
  max_ttl     = 21600 # 6 hours
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = var.whitelist_headers
      }
    }

    cookies_config { cookie_behavior = "none" }
    query_strings_config { query_string_behavior = "all" }
  }
}

# Custom Assets Cache Policy
resource "aws_cloudfront_cache_policy" "expo_assets_cache_policy" {
  name        = "${replace(var.domain_name, ".", "-")}-assets-cache"
  comment     = "Caches Expo assets based on query params for ${var.domain_name}"
  default_ttl = 604800 # 1 week
  max_ttl     = 604800 # 1 week
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = var.assets_query
      }
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "expo_cdn" {
  enabled         = true
  is_ipv6_enabled = true
  price_class     = var.price_class
  aliases         = [var.domain_name]

  origin {
    domain_name = var.origin_domain
    origin_id   = local.generated_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]

      origin_read_timeout      = 60
      origin_keepalive_timeout = 60
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/manifest"
    target_origin_id       = local.generated_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    origin_request_policy_id = aws_cloudfront_origin_request_policy.forward_host.id
    cache_policy_id          = aws_cloudfront_cache_policy.expo_custom_policy.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rollout_hash.arn
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/assets"
    target_origin_id       = local.generated_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    origin_request_policy_id = aws_cloudfront_origin_request_policy.forward_host.id
    cache_policy_id          = aws_cloudfront_cache_policy.expo_assets_cache_policy.id
  }

  default_cache_behavior {
    target_origin_id       = local.generated_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
    cache_policy_id          = data.aws_cloudfront_cache_policy.no_cache.id
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
