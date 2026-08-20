variable "project" {
  description = "Project slug. Used as a prefix for resource names, the Name tag on the app instance, and the SSM Parameter Store path (/<project>/...)."
  type        = string
  default     = "italian-shoes"
}

variable "environment" {
  description = "Environment name, used in default tags."
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  description = "CIDR for the new VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "app_port" {
  description = "Port the Next.js app listens on. The ALB targets this port; nothing else may reach it."
  type        = number
  default     = 3000
}

variable "db_port" {
  description = "PostgreSQL port."
  type        = number
  default     = 5432
}

variable "instance_type" {
  description = "App instance type. Graviton (arm64): cheaper per unit of performance, and most commodity miner payloads are x86-only."
  type        = string
  default     = "t4g.small"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version. RDS retires minors without notice — check availability with: aws rds describe-db-engine-versions --engine postgres --query 'DBEngineVersions[].EngineVersion' (17.4 was already gone by 2026-08; auto_minor_version_upgrade keeps the running instance current)."
  type        = string
  # Major 18 to match the source DB being migrated in (pg_dump cannot
  # downgrade majors; the app already ran on 18.3 in production).
  default = "18.6"
}

variable "github_repo" {
  description = "GitHub repository allowed to deploy, as owner/repo. Pinned in the OIDC trust policy — never widen to a wildcard."
  type        = string
  default     = "starklabsindia77/italian-shoes"
}

variable "github_branch" {
  description = "Branch allowed to assume the deploy role."
  type        = string
  default     = "main"
}

variable "domain_name" {
  description = "Public domain for the app. Empty string skips ACM/HTTPS entirely and serves plain HTTP — acceptable only for pre-production smoke testing, never for real traffic."
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Email address subscribed to the alerts SNS topic (GuardDuty findings, CloudWatch alarms, budget alerts). The subscription must be confirmed by clicking the link AWS emails after apply."
  type        = string
}

variable "monthly_budget_usd" {
  description = "Monthly cost budget in USD. Alerts at 80% actual and 100% forecast. Unexpected spend is the loudest signal of stolen credentials."
  type        = number
  default     = 60
}

variable "admin_cidrs" {
  description = <<-EOT
    Break-glass ONLY. CIDRs allowed SSH (22) to the app instance. Default is empty,
    which creates NO rule — this is the intended steady state. Normal access is SSM
    Session Manager. Populate temporarily during an emergency, then empty it again.
    Never put 0.0.0.0/0 here — that is exactly how the last two boxes were lost.
  EOT
  type        = list(string)
  default     = []

  validation {
    condition     = !contains(var.admin_cidrs, "0.0.0.0/0")
    error_message = "0.0.0.0/0 is forbidden in admin_cidrs. That rule is how the previous instances were compromised."
  }
}

variable "smtp_egress_cidrs" {
  description = <<-EOT
    Destinations allowed for outbound SMTP submission (smtp_port) from the app.
    Deliberate owner decision (2026-08-21): the app's email service supports a
    runtime-configurable SMTP provider, so this egress is opened, scoped by port.
    Destination defaults to anywhere because commercial SMTP relays publish
    unstable IP ranges; tighten to your relay's CIDRs if it publishes them.
    Set to [] to remove SMTP egress entirely (Resend over 443 keeps working).
  EOT
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "smtp_port" {
  description = "Outbound SMTP submission port. 587 (STARTTLS submission) matches the app's default. Implicit-TLS relays use 465 — change deliberately, don't add both."
  type        = number
  default     = 587
}

variable "assets_bucket_name" {
  description = <<-EOT
    Name of the EXISTING S3 bucket holding product assets (uploads served via
    CloudFront). Not managed by this configuration. When set, the instance role
    is granted Put/Get on it and the /<project>/S3_BUCKET_NAME parameter is
    populated. When empty, a CHANGEME placeholder parameter is created and the
    app's asset upload will fail until it is set — the rest of the app works.
  EOT
  type        = string
  default     = ""
}

variable "assets_bucket_region" {
  description = "Region of the existing assets bucket (it predates this infrastructure and lives in us-east-1, not ap-south-1). Written to the S3_REGION parameter the app reads."
  type        = string
  default     = "us-east-1"
}

variable "log_retention_days" {
  description = "Retention for VPC flow logs and app logs."
  type        = number
  default     = 90
}
