include "root" {
  path = find_in_parent_folders("root.hcl")
}

inputs = {
  my_public_ssh_key = file("~/.ssh/id_ed25519_opentofu.pub")
}