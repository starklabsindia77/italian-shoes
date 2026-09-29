# Route 53 Resolver DNS Firewall on the VPC.
#
# Blocks lookups of known-bad domains from anything in the VPC: AWS-managed
# threat lists plus public cryptomining pools. Malware that hardcodes IPs
# still gets through, so this complements (not replaces) egress filtering and
# GuardDuty.
#
# Fail-open: if the firewall itself is impaired, DNS keeps resolving. For a
# single-instance shop, an outage caused by the firewall costs more than the
# few minutes of unfiltered lookups.

locals {
  # AWS-managed domain lists. Their IDs are regional; these are ap-south-1's
  # (route53resolver ListFirewallDomainLists, ManagedOwnerName set).
  dns_fw_managed_lists = var.aws_region == "ap-south-1" ? {
    aggregate_threat = "rslvr-fdl-d1159fcdd6b942cf" # AWSManagedDomainsAggregateThreatList
    guardduty_threat = "rslvr-fdl-3d348983c03d44a1" # AWSManagedDomainsAmazonGuardDutyThreatList
    botnet_c2        = "rslvr-fdl-c6afb679f51946cd" # AWSManagedDomainsBotnetCommandandControl
    malware          = "rslvr-fdl-cb11fc50eaef4bad" # AWSManagedDomainsMalwareDomainList
  } : {}

  # Public mining pools and miner distribution sites. The app has no reason
  # to resolve any of these.
  mining_domains = [
    "hashvault.pro", "supportxmr.com", "moneroocean.stream", "c3pool.com",
    "nanopool.org", "minexmr.com", "xmrpool.eu", "2miners.com",
    "herominers.com", "unmineable.com", "nicehash.com", "f2pool.com",
    "kryptex.network", "monerohash.com", "p2pool.io", "xmrig.com",
  ]
}

resource "aws_route53_resolver_firewall_domain_list" "mining" {
  name    = "${var.project}-mining-pools"
  domains = flatten([for d in local.mining_domains : [d, "*.${d}"]])
}

resource "aws_route53_resolver_firewall_rule_group" "main" {
  name = "${var.project}-dns-firewall"
}

resource "aws_route53_resolver_firewall_rule" "managed" {
  for_each = local.dns_fw_managed_lists

  name                    = "block-${replace(each.key, "_", "-")}"
  firewall_rule_group_id  = aws_route53_resolver_firewall_rule_group.main.id
  firewall_domain_list_id = each.value
  action                  = "BLOCK"
  block_response          = "NXDOMAIN"
  priority                = 100 + index(keys(local.dns_fw_managed_lists), each.key)
}

resource "aws_route53_resolver_firewall_rule" "mining" {
  name                    = "block-mining-pools"
  firewall_rule_group_id  = aws_route53_resolver_firewall_rule_group.main.id
  firewall_domain_list_id = aws_route53_resolver_firewall_domain_list.mining.id
  action                  = "BLOCK"
  block_response          = "NXDOMAIN"
  priority                = 200
}

resource "aws_route53_resolver_firewall_rule_group_association" "main" {
  name                   = "${var.project}-dns-firewall"
  firewall_rule_group_id = aws_route53_resolver_firewall_rule_group.main.id
  vpc_id                 = aws_vpc.main.id
  priority               = 101
  mutation_protection    = "DISABLED"
}

resource "aws_route53_resolver_firewall_config" "main" {
  resource_id        = aws_vpc.main.id
  firewall_fail_open = "ENABLED"
}
