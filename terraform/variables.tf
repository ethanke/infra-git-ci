# Variables for lum.tools GitOps Infrastructure
# All sensitive values should come from environment variables or Terraform Cloud

variable "hcloud_token" {
  description = "Hetzner Cloud API token with read/write permissions"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_file" {
  description = "Path to SSH public key file for node access"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_private_key_file" {
  description = "Path to SSH private key file for node provisioning"
  type        = string
  default     = "~/.ssh/id_ed25519"
}

variable "cluster_name" {
  description = "Name prefix for all cluster resources"
  type        = string
  default     = "lum-gitops"
}

variable "network_region" {
  description = "Hetzner network region"
  type        = string
  default     = "eu-central"
}

variable "k3s_channel" {
  description = "K3s release channel (stable, latest, or specific version)"
  type        = string
  default     = "stable"
}

variable "cni_plugin" {
  description = "CNI plugin to use (flannel, calico, or cilium)"
  type        = string
  default     = "cilium"
}

variable "enable_wireguard" {
  description = "Enable WireGuard encryption for cluster network"
  type        = bool
  default     = true
}

variable "enable_longhorn" {
  description = "Enable Longhorn distributed storage"
  type        = bool
  default     = true
}

variable "enable_cert_manager" {
  description = "Enable cert-manager for TLS certificates"
  type        = bool
  default     = true
}

variable "enable_traefik" {
  description = "Enable Traefik ingress controller"
  type        = bool
  default     = true
}

variable "firewall_ssh_source" {
  description = "CIDR blocks allowed to SSH to nodes (set to your IP for security)"
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"] # Change in production!
}

variable "firewall_kube_api_source" {
  description = "CIDR blocks allowed to access Kubernetes API"
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"] # Change in production!
}

variable "ingress_controller" {
  description = "Ingress controller type (traefik, nginx, haproxy)"
  type        = string
  default     = "traefik"
}

variable "lb_type" {
  description = "Hetzner load balancer type"
  type        = string
  default     = "lb11"
}

variable "environment" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}

# etcd S3 backup configuration (optional, for DR)
variable "etcd_s3_access_key" {
  description = "S3 access key for etcd backups"
  type        = string
  default     = ""
  sensitive   = true
}

variable "etcd_s3_secret_key" {
  description = "S3 secret key for etcd backups"
  type        = string
  default     = ""
  sensitive   = true
}
