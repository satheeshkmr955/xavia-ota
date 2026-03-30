output "key_name" {
  description = "The name of the key pair for use in EC2 instances"
  value       = aws_key_pair.this.key_name
}
