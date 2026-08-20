output "alb_dns_name" {
  description = "Public DNS name of the ALB. Point your domain's CNAME/ALIAS here."
  value       = aws_lb.main.dns_name
}

output "deploy_role_arn" {
  description = "GitHub secret AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.deploy.arn
}

output "artifacts_bucket" {
  description = "GitHub secret ARTIFACTS_BUCKET."
  value       = aws_s3_bucket.artifacts.bucket
}

output "healthcheck_url" {
  description = "GitHub secret HEALTHCHECK_URL — the deploy's final gate."
  value       = var.domain_name != "" ? "https://${var.domain_name}/api/healthz" : "http://${aws_lb.main.dns_name}/api/healthz"
}

output "instance_id" {
  description = "App instance ID."
  value       = aws_instance.app.id
}

output "ssm_session_command" {
  description = "Open a shell on the app instance (the only shell access that exists)."
  value       = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.aws_region}"
}

output "rds_endpoint" {
  description = "RDS endpoint (host:port). Reachable only from the app security group."
  value       = aws_db_instance.main.endpoint
}

output "parameter_store_path" {
  description = "SSM Parameter Store path prefix for app config. Fill the CHANGEME placeholders here."
  value       = "/${var.project}"
}

output "acm_validation_records" {
  description = "DNS records to create at your DNS host to validate the ACM certificate (empty when domain_name is unset)."
  value = var.domain_name == "" ? [] : [
    for dvo in aws_acm_certificate.app[0].domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ]
}
