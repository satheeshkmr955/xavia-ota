resource "aws_instance" "this" {
  count         = var.instance_count
  ami           = data.aws_ami.ubuntu_latest.id
  instance_type = var.instance_type
  subnet_id     = data.aws_subnets.default.ids[0]

  associate_public_ip_address = var.associate_public_ip

  key_name               = var.key_name
  vpc_security_group_ids = var.vpc_security_group_ids

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = merge(
    var.custom_tags,
    {
      Name      = "${var.instance_name}-${count.index}"
      ManagedBy = "Terragrunt"
    }
  )
}
