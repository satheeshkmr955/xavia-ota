output "profile_name" {
  value = aws_iam_instance_profile.ota_instance_profile.name
}

output "ota_instance_profile_name" {
  description = "The name of the IAM instance profile for the OTA server"
  value       = aws_iam_instance_profile.ota_instance_profile.name
}

output "ota_role_arn" {
  description = "The ARN of the IAM role"
  value       = aws_iam_role.ota_ecr_role.arn
}
