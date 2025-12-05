# Outputs from the Kubernetes cluster
# These values are used for subsequent configuration and CI/CD

output "kubeconfig" {
  description = "Kubeconfig file content for kubectl access"
  value       = module.kube-hetzner.kubeconfig
  sensitive   = true
}

output "kubeconfig_file" {
  description = "Path to the generated kubeconfig file"
  value       = module.kube-hetzner.kubeconfig_file
  sensitive   = true
}

output "control_plane_ips" {
  description = "Public IPs of control plane nodes"
  value       = module.kube-hetzner.control_planes_public_ipv4
}

output "agent_ips" {
  description = "Public IPs of agent nodes"
  value       = module.kube-hetzner.agents_public_ipv4
}

output "load_balancer_ipv4" {
  description = "IPv4 address of the ingress load balancer"
  value       = module.kube-hetzner.ingress_public_ipv4
}

output "load_balancer_ipv6" {
  description = "IPv6 address of the ingress load balancer"
  value       = module.kube-hetzner.ingress_public_ipv6
}

output "cluster_name" {
  description = "Name of the Kubernetes cluster"
  value       = var.cluster_name
}

output "ssh_key_name" {
  description = "Name of the SSH key in Hetzner"
  value       = module.kube-hetzner.ssh_key_id
}

# For FluxCD bootstrap
output "flux_bootstrap_values" {
  description = "Values needed for FluxCD bootstrap"
  value = {
    cluster_name    = var.cluster_name
    environment     = var.environment
    ingress_ip      = module.kube-hetzner.ingress_public_ipv4
  }
}

# For CI/CD integration
output "ci_values" {
  description = "Values needed for CI/CD pipelines"
  value = {
    registry_url     = "registry.lum.tools"
    cluster_endpoint = "https://kube-api.lum.tools:6443"
    ingress_domain   = "lum.tools"
  }
}
