# Internet-facing ALB. The only thing in this design that faces the internet.

resource "aws_lb" "main" {
  name               = "${var.project}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  drop_invalid_header_fields = true
  enable_deletion_protection = true
}

resource "aws_lb_target_group" "app" {
  name     = "${var.project}-app"
  port     = var.app_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  # /api/healthz is deliberately trivial (no DB call): a brief DB blip must
  # not make the ALB cycle the only app instance. Human-facing DB health
  # lives at /api/health.
  health_check {
    path                = "/api/healthz"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.app.id
  port             = var.app_port
}

# ---------------------------------------------------------------------------
# TLS. Gated on var.domain_name:
#   domain_name = ""  -> HTTP only. NON-PRODUCTION. Smoke-testing only —
#                        credentials and sessions would cross the wire in
#                        the clear. Set a domain before real traffic.
#   domain_name set   -> ACM cert (DNS validation), HTTPS listener with
#                        TLS 1.3 policy, HTTP 301s to HTTPS.
#
# DNS validation is manual (no Route53 zone is assumed): apply once, add the
# CNAME from `terraform output acm_validation_records` at your DNS host,
# then apply again — the validation resource waits for it and the HTTPS
# listener is created after. See infra/DEPLOY_CHECKLIST.md.
# ---------------------------------------------------------------------------

resource "aws_acm_certificate" "app" {
  count = var.domain_name != "" ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "app" {
  count = var.domain_name != "" ? 1 : 0

  certificate_arn = aws_acm_certificate.app[0].arn

  timeouts {
    create = "60m"
  }
}

resource "aws_lb_listener" "https" {
  count = var.domain_name != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.app[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  depends_on = [aws_acm_certificate_validation.app]
}

# HTTP: redirect to HTTPS when a certificate exists, otherwise serve the app.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = var.domain_name != "" ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = var.domain_name == "" ? [1] : []
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.app.arn
    }
  }
}
