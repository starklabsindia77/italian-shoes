# Security groups.
#
# Every rule is a separate aws_vpc_security_group_ingress_rule /
# aws_vpc_security_group_egress_rule resource, NOT an inline block:
# precise per-rule diffs and descriptions, no whole-rule-set churn.
#
# HONEST LIMITATION (proven the hard way on 2026-08-21, when a console
# session added SSH 0.0.0.0/0 to the app SG): separate rule resources only
# manage THEMSELVES — Terraform does NOT see rules added by hand, and
# `terraform plan` will NOT flag them. Only inline rule blocks assert
# exclusive ownership. Detection of hand-added rules therefore needs a
# real detector (EventBridge on AuthorizeSecurityGroupIngress, or an AWS
# Config rule such as restricted-ssh) — periodic plans are not one.
#
# Note: the AWS provider removes the default allow-all egress rule when it
# creates an aws_security_group, so each group's egress is exactly the rule
# resources below and nothing else.

# ---------------------------------------------------------------------------
# ALB — the ONLY security group in this configuration allowed 0.0.0.0/0
# ingress, and only on 80/443.
# ---------------------------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${var.project}-alb"
  description = "Internet-facing ALB. The only SG with public ingress."
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${var.project}-alb" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "Public HTTP (redirects to HTTPS when a certificate exists)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "Public HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# ALB may talk to the app instance on the app port and nowhere else.
resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb.id
  description                  = "Forward + health-check traffic to the app"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = var.app_port
  to_port                      = var.app_port
}

# ---------------------------------------------------------------------------
# App instance — ZERO CIDR-based ingress. The only way in is from the ALB's
# security group on the app port. No SSH; shell access is SSM Session
# Manager, which the agent initiates OUTBOUND over 443.
# ---------------------------------------------------------------------------

resource "aws_security_group" "app" {
  name        = "${var.project}-app"
  description = "App instance. Ingress from ALB only; restricted egress."
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${var.project}-app" }
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "App traffic from the ALB only"
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = var.app_port
  to_port                      = var.app_port
}

# Break-glass SSH. var.admin_cidrs defaults to [] so NO rule exists in the
# steady state (and validation forbids 0.0.0.0/0). If populated during an
# emergency, remember the instance has no key pair and sshd is masked —
# you would also have to undo both of those on the box via SSM first.
# This exists so that break-glass is a deliberate three-step act, not a
# console shortcut.
resource "aws_vpc_security_group_ingress_rule" "app_ssh_breakglass" {
  for_each = toset(var.admin_cidrs)

  security_group_id = aws_security_group.app.id
  description       = "BREAK-GLASS SSH - remove when the emergency is over"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

# --- App egress ------------------------------------------------------------
# Restricted egress is a real mitigation for the failure mode that happened
# here: cryptominer pools overwhelmingly listen on 3333/4444/5555/7777/14444,
# so an egress policy of 443/80 + DNS + DB renders most drop-in miner
# payloads unable to reach their pool at all. Honesty note: a pool fronted
# on 443 would still work — this raises the bar, it is not a seal.

resource "aws_vpc_security_group_egress_rule" "app_https" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS: SSM agent, dnf mirrors, S3 artifacts, Razorpay/Resend APIs, npm registry (prisma CLI)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "app_http" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP: some dnf mirrors redirect through 80"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# DNS to the VPC resolver only (VPC CIDR covers the .2 resolver address).
# UDP per spec; if you ever see truncated-response failures (large TXT/DNSSEC
# answers fall back to TCP 53), add a matching TCP 53 rule deliberately.
resource "aws_vpc_security_group_egress_rule" "app_dns" {
  security_group_id = aws_security_group.app.id
  description       = "DNS to the VPC resolver"
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = "udp"
  from_port         = 53
  to_port           = 53
}

resource "aws_vpc_security_group_egress_rule" "app_to_rds" {
  security_group_id            = aws_security_group.app.id
  description                  = "PostgreSQL to the RDS security group only"
  referenced_security_group_id = aws_security_group.rds.id
  ip_protocol                  = "tcp"
  from_port                    = var.db_port
  to_port                      = var.db_port
}

# Outbound SMTP submission. Deliberate owner decision (see variables.tf):
# the app's email service can be switched to SMTP at runtime via its
# settings UI, and silently-broken email was judged worse than this
# port-scoped opening. Not a miner-relevant port. Set smtp_egress_cidrs=[]
# to remove.
resource "aws_vpc_security_group_egress_rule" "app_smtp" {
  for_each = toset(var.smtp_egress_cidrs)

  security_group_id = aws_security_group.app.id
  description       = "SMTP submission (owner-approved, port-scoped)"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = var.smtp_port
  to_port           = var.smtp_port
}

# ---------------------------------------------------------------------------
# RDS — ingress from the app SG only. No egress rules at all: security
# groups are stateful, so reply traffic flows without one, and the database
# has no business initiating connections to anything.
# ---------------------------------------------------------------------------

resource "aws_security_group" "rds" {
  name        = "${var.project}-rds"
  description = "RDS PostgreSQL. Ingress from the app SG only."
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${var.project}-rds" }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_app" {
  security_group_id            = aws_security_group.rds.id
  description                  = "PostgreSQL from the app instance only"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = var.db_port
  to_port                      = var.db_port
}
