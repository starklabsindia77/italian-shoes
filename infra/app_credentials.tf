# App-user isolation from the instance role.
#
# The Next.js process runs as the unprivileged `app` user but only needs AWS
# for one thing: asset uploads to the assets bucket. It used to get those
# credentials from IMDS, which meant any code running as the app could mint
# instance-role credentials (Parameter Store secrets, artifacts bucket, SSM).
#
# Now:
#   - the app user is blocked from IMDS on the instance (nftables uid rule),
#     applied by the SSM association below;
#   - a root-only helper assumes `app_s3` (below) every 15 minutes and hands the
#     short-lived credentials to the app via credential_process;
#   - `app_s3` can only touch the assets bucket, and only from this VPC's NAT
#     egress IP, so its credentials are useless if copied off the box.
#
# Rolled out via SSM State Manager rather than user_data: changing user_data
# replaces the instance (see compute.tf). The association re-applies every
# 30 minutes, so hand edits on the box are reverted.

locals {
  app_s3_enabled = var.assets_bucket_name != ""
}

data "aws_iam_policy_document" "app_s3_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.instance.arn]
    }
  }
}

resource "aws_iam_role" "app_s3" {
  count = local.app_s3_enabled ? 1 : 0

  name                 = "${var.project}-app-s3"
  assume_role_policy   = data.aws_iam_policy_document.app_s3_assume.json
  max_session_duration = 3600
}

data "aws_iam_policy_document" "app_s3" {
  statement {
    sid       = "AppAssets"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["arn:aws:s3:::${var.assets_bucket_name}/*"]
  }

  # Requests from the instance reach S3 through the NAT gateway, so they carry
  # its public IP. Anything else means the credentials left the box.
  statement {
    sid       = "DenyOutsideVpcEgress"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]
    condition {
      test     = "NotIpAddress"
      variable = "aws:SourceIp"
      values   = ["${aws_eip.nat.public_ip}/32"]
    }
    condition {
      test     = "Bool"
      variable = "aws:ViaAWSService"
      values   = ["false"]
    }
  }
}

resource "aws_iam_role_policy" "app_s3" {
  count = local.app_s3_enabled ? 1 : 0

  name   = "assets-only"
  role   = aws_iam_role.app_s3[0].id
  policy = data.aws_iam_policy_document.app_s3.json
}

resource "aws_ssm_document" "app_isolation" {
  count = local.app_s3_enabled ? 1 : 0

  name            = "${var.project}-app-isolation"
  document_type   = "Command"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "2.2"
    description   = "Block IMDS for the app user and provide narrow S3 credentials"
    mainSteps = [{
      action = "aws:runShellScript"
      name   = "appIsolation"
      inputs = {
        timeoutSeconds = "300"
        runCommand = [templatefile("${path.module}/templates/app_isolation.sh.tftpl", {
          region       = var.aws_region
          app_port     = var.app_port
          app_role_arn = aws_iam_role.app_s3[0].arn
        })]
      }
    }]
  })
}

resource "aws_ssm_association" "app_isolation" {
  count = local.app_s3_enabled ? 1 : 0

  name                = aws_ssm_document.app_isolation[0].name
  association_name    = "${var.project}-app-isolation"
  schedule_expression = "rate(30 minutes)"

  targets {
    key    = "InstanceIds"
    values = [aws_instance.app.id]
  }

  # The instance role must be allowed to assume app_s3 before the script runs.
  depends_on = [aws_iam_role_policy.instance, aws_iam_role_policy.app_s3]
}
