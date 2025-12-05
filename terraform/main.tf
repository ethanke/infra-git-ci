# Main Kubernetes Cluster Configuration
# Using kube-hetzner module for K3s on MicroOS
# https://github.com/kube-hetzner/terraform-hcloud-kube-hetzner

module "kube-hetzner" {
  source = "kube-hetzner/kube-hetzner/hcloud"
  version = "2.18.3"

  providers = {
    hcloud = hcloud
  }

  # ============================================================================
  # CLUSTER BASICS
  # ============================================================================
  
  hcloud_token = var.hcloud_token
  
  ssh_public_key  = file(pathexpand(var.ssh_public_key_file))
  ssh_private_key = file(pathexpand(var.ssh_private_key_file))
  
  network_region = var.network_region

  # ============================================================================
  # CONTROL PLANE NODES (HA: 3 nodes across 3 locations)
  # ============================================================================
  
  control_plane_nodepools = [
    {
      name        = "control-plane-fsn1"
      server_type = "cx22"      # 2 vCPU, 4GB RAM - €3.95/mo
      location    = "fsn1"
      labels      = ["node.kubernetes.io/role=control-plane"]
      taints      = []
      count       = 1
    },
    {
      name        = "control-plane-nbg1"
      server_type = "cx22"
      location    = "nbg1"
      labels      = ["node.kubernetes.io/role=control-plane"]
      taints      = []
      count       = 1
    },
    {
      name        = "control-plane-hel1"
      server_type = "cx22"
      location    = "hel1"
      labels      = ["node.kubernetes.io/role=control-plane"]
      taints      = []
      count       = 1
    }
  ]

  # ============================================================================
  # AGENT NODES (Workers)
  # ============================================================================
  
  agent_nodepools = [
    {
      name        = "agent-general"
      server_type = "cx32"      # 4 vCPU, 8GB RAM - €7.56/mo
      location    = "fsn1"
      labels      = ["node.kubernetes.io/workload=general"]
      taints      = []
      count       = 2
    },
    {
      name        = "agent-general-nbg1"
      server_type = "cx32"      # Multi-zone for resilience
      location    = "nbg1"
      labels      = ["node.kubernetes.io/workload=general"]
      taints      = []
      count       = 1
    },
    {
      name        = "agent-observability"
      server_type = "cx22"      # 2 vCPU, 4GB RAM
      location    = "nbg1"
      labels      = [
        "node.kubernetes.io/workload=observability",
        "lum.tools/observability=true"
      ]
      taints      = []
      count       = 1
    },
    # Egress nodepool for outbound IP control (e.g., email, API calls)
    {
      name        = "egress"
      server_type = "cx22"
      location    = "fsn1"
      labels      = ["node.kubernetes.io/role=egress"]
      taints      = ["node.kubernetes.io/role=egress:NoSchedule"]
      floating_ip = true
      count       = 1
    }
  ]

  # ============================================================================
  # AUTOSCALING POOLS (Scale 0-5 on demand)
  # ============================================================================
  
  autoscaler_nodepools = [
    {
      name        = "autoscaled-small"
      server_type = "cx22"      # 2 vCPU, 4GB - for lightweight workloads
      location    = "fsn1"
      min_nodes   = 0
      max_nodes   = 5
      labels      = { "node.kubernetes.io/workload" = "autoscaled" }
      taints      = []
    },
    {
      name        = "autoscaled-medium"
      server_type = "cx32"      # 4 vCPU, 8GB - for memory-heavy workloads
      location    = "nbg1"
      min_nodes   = 0
      max_nodes   = 3
      labels      = { "node.kubernetes.io/workload" = "autoscaled-medium" }
      taints      = []
    }
  ]
  
  # Autoscaler tuning for cost optimization
  cluster_autoscaler_extra_args = [
    "--ignore-daemonsets-utilization=true",
    "--scale-down-delay-after-add=10m",
    "--scale-down-unneeded-time=10m",
    "--scale-down-utilization-threshold=0.5",
  ]

  # ============================================================================
  # NETWORKING
  # ============================================================================
  
  # Cilium CNI with Hubble for network observability
  cni_plugin              = var.cni_plugin
  disable_kube_proxy      = true  # Cilium replaces kube-proxy
  cilium_hubble_enabled   = true  # Network flow observability
  
  # WireGuard encryption for pod-to-pod traffic
  enable_wireguard = var.enable_wireguard
  
  # Cilium custom values for enhanced observability
  # Note: trustCRDsExist=true bypasses CRD validation until prometheus-operator is installed
  cilium_values = <<-EOT
    hubble:
      relay:
        enabled: true
      ui:
        enabled: true
      metrics:
        enabled:
          - dns
          - drop
          - tcp
          - flow
          - icmp
          - http
        serviceMonitor:
          enabled: true
          trustCRDsExist: true
    prometheus:
      enabled: true
      serviceMonitor:
        enabled: true
        trustCRDsExist: true
    operator:
      prometheus:
        enabled: true
        serviceMonitor:
          enabled: true
          trustCRDsExist: true
  EOT

  # ============================================================================
  # INGRESS & LOAD BALANCER
  # ============================================================================
  
  ingress_controller           = var.ingress_controller
  traefik_redirect_to_https    = true
  traefik_additional_options   = ["--metrics.prometheus=true"]
  
  lb_hostname = "kube-api.lum.tools"
  
  load_balancer_type     = var.lb_type
  load_balancer_location = "fsn1"
  
  # Enable control plane load balancer for HA
  use_control_plane_lb = true

  # ============================================================================
  # STORAGE
  # ============================================================================
  
  enable_longhorn      = var.enable_longhorn
  longhorn_fstype      = "ext4"
  longhorn_replica_count = 2
  
  # Hetzner CSI for block storage (enabled by default, set to true to disable)
  disable_hetzner_csi = false

  # ============================================================================
  # CERTIFICATES
  # ============================================================================
  
  enable_cert_manager = var.enable_cert_manager

  # ============================================================================
  # K3S CONFIGURATION
  # ============================================================================
  
  initial_k3s_channel         = var.k3s_channel
  automatically_upgrade_k3s   = true
  automatically_upgrade_os    = true
  
  # System upgrade controller for managed upgrades
  system_upgrade_use_drain   = true
  
  # Custom DNS servers for reliability (Cloudflare + Google)
  dns_servers = [
    "1.1.1.1",
    "8.8.8.8",
    "2606:4700:4700::1111",
  ]
  
  # etcd S3 backup for disaster recovery (enable when S3 is configured)
  # Uncomment and configure once MinIO/S3 is set up
  # etcd_s3_backup = {
  #   etcd-s3-endpoint   = "s3.lum.tools"
  #   etcd-s3-access-key = var.etcd_s3_access_key
  #   etcd-s3-secret-key = var.etcd_s3_secret_key
  #   etcd-s3-bucket     = "k8s-etcd-backups"
  # }
  
  # Kured for safe reboots
  kured_options = {
    "reboot-days"    = "mo,tu,we,th,fr"
    "start-time"     = "3am"
    "end-time"       = "6am"
    "time-zone"      = "Europe/Paris"
  }

  # ============================================================================
  # SECURITY
  # ============================================================================
  
  firewall_ssh_source       = var.firewall_ssh_source
  firewall_kube_api_source  = var.firewall_kube_api_source
  
  # Create kubeconfig for local access
  create_kubeconfig = true
  
  # Disable public IP for agents (use NAT)
  # enable_public_net_ipv4 = false  # Uncomment for extra security
  # enable_public_net_ipv6 = false

  # ============================================================================
  # LABELS & METADATA
  # ============================================================================
  
  cluster_name = var.cluster_name
  
  base_domain = "lum.tools"
}
