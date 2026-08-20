# Detection. Last time the compromise was discovered because the box fell
# over. This file exists so the NEXT anomaly is an email within minutes,
# not an outage within weeks.

# ---------------------------------------------------------------------------
# GuardDuty — has dedicated CryptoCurrency:EC2/BitcoinTool.B! finding types
# and catches mining-pool DNS lookups from VPC DNS query logs.
# NOTE: one detector per account/region. If GuardDuty is already enabled in
# ap-south-1, import it instead of creating:
#   terraform import aws_guardduty_detector.main <detector-id>
# ---------------------------------------------------------------------------

resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}

resource "aws_guardduty_detector_feature" "ebs_malware" {
  detector_id = aws_guardduty_detector.main.id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

# ---------------------------------------------------------------------------
# SNS topic all alerts fan into, with an email subscription.
# The subscription email must be confirmed by clicking the link AWS sends.
# ---------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
}

data "aws_iam_policy_document" "alerts_topic" {
  statement {
    sid     = "AllowAWSServicesPublish"
    actions = ["sns:Publish"]
    principals {
      type = "Service"
      identifiers = [
        "events.amazonaws.com",     # EventBridge (GuardDuty findings rule)
        "cloudwatch.amazonaws.com", # CloudWatch alarms
        "budgets.amazonaws.com",    # AWS Budgets notifications
      ]
    }
    resources = [aws_sns_topic.alerts.arn]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn    = aws_sns_topic.alerts.arn
  policy = data.aws_iam_policy_document.alerts_topic.json
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---------------------------------------------------------------------------
# GuardDuty findings (severity >= 4 — medium and up) -> SNS.
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "guardduty" {
  name        = "${var.project}-guardduty-findings"
  description = "GuardDuty findings, medium severity and above"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [{ numeric = [">=", 4] }]
    }
  })
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule = aws_cloudwatch_event_rule.guardduty.name
  arn  = aws_sns_topic.alerts.arn
}

# ---------------------------------------------------------------------------
# CloudWatch alarms on the app instance.
# ---------------------------------------------------------------------------

# Miners peg the CPU. 15 sustained minutes of >80% on this workload is
# either an incident or a capacity problem — both deserve an email.
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project}-app-cpu-high"
  alarm_description   = "App instance CPU > 80% for 15 minutes"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  dimensions          = { InstanceId = aws_instance.app.id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "breaching" # missing metrics from a compromised/dead box should alarm too
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# Egress spike: exfiltration, spam, or proxy abuse. 500 MB per 5-minute
# period (~13 Mbit/s sustained) for 15 minutes is far above this app's
# normal traffic (assets are served by CloudFront, not the instance).
# Tune after observing a real baseline.
resource "aws_cloudwatch_metric_alarm" "network_out_spike" {
  alarm_name          = "${var.project}-app-network-out-spike"
  alarm_description   = "App instance NetworkOut abnormally high for 15 minutes"
  namespace           = "AWS/EC2"
  metric_name         = "NetworkOut"
  dimensions          = { InstanceId = aws_instance.app.id }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 3
  threshold           = 500000000
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# "The box fell over" was the previous detection mechanism. Make it page.
resource "aws_cloudwatch_metric_alarm" "status_check" {
  alarm_name          = "${var.project}-app-status-check"
  alarm_description   = "App instance failing EC2 status checks"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  dimensions          = { InstanceId = aws_instance.app.id }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# ---------------------------------------------------------------------------
# Budget. Unexpected spend is the loudest signal of stolen credentials —
# miners on stolen keys show up on the bill before anywhere else.
# ---------------------------------------------------------------------------

resource "aws_budgets_budget" "monthly" {
  name        = "${var.project}-monthly"
  budget_type = "COST"
  time_unit   = "MONTHLY"

  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"

  notification {
    notification_type          = "ACTUAL"
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    notification_type          = "FORECASTED"
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
    subscriber_email_addresses = [var.alert_email]
  }
}
