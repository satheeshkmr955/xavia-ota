output "allocation_id" {
  description = "The ID used for the EIP association"
  value       = aws_eip.this.id
}

output "public_ip" {
  description = "The actual public EIP address"
  value       = aws_eip.this.public_ip
}