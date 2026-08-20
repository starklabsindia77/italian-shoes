# SSM Parameter Store: the single source of runtime config for the app.
# The instance's refresh-app-env script pulls everything under /<project>/
# into /opt/app/shared/app.env (mode 0400, owned by the app user) at every
# service start. Parameter basename == environment variable name.

# --- Managed by Terraform ---------------------------------------------------

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project}/DATABASE_URL"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.main.username}:${urlencode(random_password.db.result)}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}?sslmode=require&sslrootcert=/etc/ssl/rds/global-bundle.pem"
}

resource "random_password" "nextauth_secret" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "nextauth_secret" {
  name  = "/${var.project}/NEXTAUTH_SECRET"
  type  = "SecureString"
  value = random_password.nextauth_secret.result
}

resource "aws_ssm_parameter" "nextauth_url" {
  name  = "/${var.project}/NEXTAUTH_URL"
  type  = "String"
  value = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

resource "aws_ssm_parameter" "s3_region" {
  name  = "/${var.project}/S3_REGION"
  type  = "String"
  value = var.assets_bucket_region # the assets bucket's region, NOT the deploy region
}

resource "aws_ssm_parameter" "max_file_size_mb" {
  name  = "/${var.project}/MAX_FILE_SIZE_MB"
  type  = "String"
  value = "50" # upload size cap read by the asset-upload route
}

resource "aws_ssm_parameter" "s3_bucket_name" {
  name  = "/${var.project}/S3_BUCKET_NAME"
  type  = "String"
  value = var.assets_bucket_name != "" ? var.assets_bucket_name : "CHANGEME"
}

# --- Placeholders: fill the real values in the console/CLI after apply ------
# Terraform creates these once with value "CHANGEME" and then ignores value
# changes, so setting the real secret in the console does NOT show as drift
# and the real value never enters Terraform state. See DEPLOY_CHECKLIST.md.

locals {
  placeholder_secure_params = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RESEND_API_KEY",
    "ADMIN_PASSWORD", # read by prisma/seed.ts; without it the seed falls back to a known default
  ]
  placeholder_string_params = [
    "ADMIN_EMAIL",
    "ADMIN_NAME",
  ]
}

resource "aws_ssm_parameter" "placeholder_secure" {
  for_each = toset(local.placeholder_secure_params)

  name  = "/${var.project}/${each.value}"
  type  = "SecureString"
  value = "CHANGEME"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "placeholder_string" {
  for_each = toset(local.placeholder_string_params)

  name  = "/${var.project}/${each.value}"
  type  = "String"
  value = "CHANGEME"

  lifecycle {
    ignore_changes = [value]
  }
}
