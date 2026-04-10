resource "aws_iam_role" "ota_ecr_role" {
  name = "xavia-ota-ecr-pull-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_invalidation" {
  role       = aws_iam_role.ota_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudFrontFullAccess"
}

resource "aws_iam_role_policy_attachment" "ecr_attach" {
  role       = aws_iam_role.ota_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_role_policy_attachment" "ssm_full_access_attach" {
  role       = aws_iam_role.ota_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMFullAccess"
}

resource "aws_iam_role_policy_attachment" "s3_full_access_attach" {
  role       = aws_iam_role.ota_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "route53_attach" {
  role       = aws_iam_role.ota_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRoute53FullAccess"
}

resource "aws_iam_instance_profile" "ota_instance_profile" {
  name = "xavia-ota-ec2-profile"
  role = aws_iam_role.ota_ecr_role.name
}