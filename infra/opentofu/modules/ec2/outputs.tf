output "instance_ids" {
  description = "IDs of the created EC2 instances"
  value       = aws_instance.this[*].id
}

output "public_dns" {
  description = "The public DNS name assigned to the instance"
  # Note: if your module uses 'count', use [0]. If not, use aws_instance.this.public_dns
  value = aws_instance.this[0].public_dns
}
