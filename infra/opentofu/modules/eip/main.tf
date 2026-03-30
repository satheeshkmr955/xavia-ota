resource "aws_eip" "this" {
  domain = "vpc"

  depends_on = [var.igw_id]

  tags = merge(
    var.custom_tags,
    {
      Name      = var.resource_name
      ManagedBy = "Terragrunt"
    }
  )
}
