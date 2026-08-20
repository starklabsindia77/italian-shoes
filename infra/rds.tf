# RDS PostgreSQL. Private subnets, encrypted, never publicly accessible.

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db"
  subnet_ids = aws_subnet.private[*].id
}

# Master password exists only in: this resource's state (encrypt the state
# bucket), the RDS control plane, and the SecureString DATABASE_URL
# parameter below. Never in a file, never in a GitHub secret, never in a
# plaintext output.
resource "random_password" "db" {
  length = 32
  # RDS forbids '/', '@', '"' and spaces in master passwords; the URL below
  # percent-encodes whatever remains.
  override_special = "!#$%&*()-_=+[]{}<>?"
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  db_name  = replace(var.project, "-", "_")
  username = "app_admin"
  password = random_password.db.result
  port     = var.db_port

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # THE setting that matters most. The database is reachable exclusively
  # from the app security group inside the VPC. The old setup's DB accepted
  # connections from the internet (the old CI built against it from a
  # GitHub runner). Never flip this.
  publicly_accessible = false

  storage_type          = "gp3"
  allocated_storage     = 20
  max_allocated_storage = 100 # storage autoscaling ceiling
  storage_encrypted     = true

  backup_retention_period = 7
  # ~18:00 UTC = 23:30 IST — low-traffic window.
  backup_window              = "18:00-19:00"
  maintenance_window         = "sun:19:30-sun:20:30"
  auto_minor_version_upgrade = true

  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project}-db-final"

  performance_insights_enabled = true
  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade",
  ]

  tags = { Name = "${var.project}-db" }
}
