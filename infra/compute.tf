# App instance: Amazon Linux 2023 arm64 on Graviton, private subnet, no
# public IP, no key pair, IMDSv2 enforced, SSM-only access.

data "aws_ami" "al2023_arm64" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-arm64"] # excludes the -minimal variants
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/app/${var.project}"
  retention_in_days = var.log_retention_days
}

# ---------------------------------------------------------------------------
# Instance IAM role — least privilege.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "instance_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance" {
  name               = "${var.project}-instance"
  assume_role_policy = data.aws_iam_policy_document.instance_assume.json
}

# Session Manager. This is the entire remote-access story: the agent dials
# OUT over 443, so no inbound port ever opens for shell access.
resource "aws_iam_role_policy_attachment" "instance_ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# The AWS-managed key SSM uses for SecureString parameters.
data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

data "aws_iam_policy_document" "instance" {
  # Pull release artifacts. Read-only, this bucket only.
  statement {
    sid       = "ReadArtifacts"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.artifacts.arn}/*"]
  }

  # Read app config/secrets from Parameter Store, this project's path only.
  statement {
    sid = "ReadParameters"
    actions = [
      "ssm:GetParametersByPath",
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}",
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/*",
    ]
  }

  # Decrypt SecureString values — but only when the request arrives via SSM,
  # so these credentials cannot be used to decrypt anything else even if
  # stolen off the instance.
  statement {
    sid       = "DecryptViaSSMOnly"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }

  # Ship logs to the app log group only.
  statement {
    sid = "WriteAppLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
    ]
    resources = [
      aws_cloudwatch_log_group.app.arn,
      "${aws_cloudwatch_log_group.app.arn}:*",
    ]
  }

  # App asset uploads (product images / GLB models) to the EXISTING assets
  # bucket, when configured. Not in the original spec's IAM list, added
  # deliberately: the app's /api/assets/upload writes to S3 and would be
  # dead without it. Scoped to that one bucket.
  dynamic "statement" {
    for_each = var.assets_bucket_name != "" ? [1] : []
    content {
      sid = "AppAssets"
      actions = [
        "s3:PutObject",
        "s3:GetObject",
      ]
      resources = ["arn:aws:s3:::${var.assets_bucket_name}/*"]
    }
  }
}

resource "aws_iam_role_policy" "instance" {
  name   = "least-privilege"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.instance.json
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project}-app"
  role = aws_iam_role.instance.name
}

# ---------------------------------------------------------------------------
# The instance.
# ---------------------------------------------------------------------------

resource "aws_instance" "app" {
  ami           = data.aws_ami.al2023_arm64.id
  instance_type = var.instance_type

  subnet_id                   = aws_subnet.private[0].id
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = false
  # No key_name on purpose. SSH is not part of this design (constraint 2).

  iam_instance_profile = aws_iam_instance_profile.app.name

  # IMDSv2 required + hop limit 1 closes the classic SSRF → IMDS →
  # instance-credential-theft → whole-account-breach path (constraint 6).
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
    # Both compromised instances had their root volumes deleted on
    # termination, which destroyed all forensic evidence. Keep the volume
    # this time. Cost of an orphaned 30GB gp3 volume: ~$2.40/mo; cost of
    # never knowing the entry point: two rebuilds and counting.
    delete_on_termination = false
    tags                  = { Name = "${var.project}-app-root" }
  }

  monitoring = true # detailed (1-minute) CloudWatch metrics

  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    project    = var.project
    region     = var.aws_region
    app_port   = var.app_port
    param_path = "/${var.project}"
    log_group  = aws_cloudwatch_log_group.app.name
  })

  # A new AL2023 AMI release must not silently replace production.
  # To move to a new AMI: launch deliberately (taint / -replace) during a
  # maintenance window. user_data changes also imply replacement — same rule.
  lifecycle {
    ignore_changes = [ami]
  }

  tags = { Name = "${var.project}-app" }
}
