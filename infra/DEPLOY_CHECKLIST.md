# Go-live checklist

Manual steps owned by the operator, in order. Terraform never runs `apply`
by itself and CI has no permissions beyond the deploy pipeline.

## 0. Credential rotation (from the incident — do first)

- [ ] Revoke the GitHub PAT that lived in the old `d.sh` (github.com →
      Settings → Developer settings → Personal access tokens). The file is
      deleted from the working tree, but deletion is not revocation.
- [ ] Rotate / deactivate the old static S3 IAM keys
      (`NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID` era). The new design uses the
      instance role — nothing should recreate static keys.
- [ ] Rotate the Razorpay key pair (dashboard.razorpay.com → API keys).
- [ ] Rotate the Resend API key.
- [ ] Consider the old `DATABASE_URL`, `NEXTAUTH_SECRET`, and any seeded
      admin password burned. The new RDS + Parameter Store setup generates
      fresh ones; never reuse the old values anywhere.
- [ ] In the GitHub repo: delete ALL old Actions secrets
      (`SSH_PRIVATE_KEY`, `SERVER_IP`, `DATABASE_URL`, `NEXTAUTH_*`,
      `RAZORPAY_*`, `NEXT_PUBLIC_*`). The new pipeline needs exactly three
      (step 6) and none of them are credentials.

## 1. Prerequisites

- [ ] Commit `package-lock.json` (CI uses `npm ci`; it fails without it).
- [ ] Create the state bucket (commands in `README.md`), uncomment the
      backend block in `versions.tf`, run `terraform init -migrate-state`.
- [ ] Copy `terraform.tfvars.example` → `terraform.tfvars` and verify every
      value — especially `alert_email`, `github_repo`, `assets_bucket_name`.
- [ ] If GuardDuty is already enabled in ap-south-1:
      `terraform import aws_guardduty_detector.main <detector-id>`.

## 2. First apply

- [ ] `terraform plan -out=tfplan` — confirm: the ONLY `0.0.0.0/0` ingress
      rules in the plan are the ALB's 80 and 443.
- [ ] `terraform apply tfplan`.
- [ ] Click the confirmation link in the SNS subscription email — until
      then, no alerts are delivered.

## 3. Parameter Store

- [ ] Fill every `CHANGEME` under `/italian-shoes/` with the ROTATED values:
      `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`,
      `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` (SecureString ones as
      SecureString). Example:
      `aws ssm put-parameter --name /italian-shoes/RESEND_API_KEY --type SecureString --value '...' --overwrite`
      (`--overwrite` is safe: Terraform ignores value changes on these.)
- [ ] Verify `S3_BUCKET_NAME` is the real assets bucket, not `CHANGEME`.

## 4. HTTPS (skip only for smoke testing)

- [ ] Set `domain_name` in `terraform.tfvars`, `terraform apply`.
- [ ] Add the CNAME from `terraform output acm_validation_records` at your
      DNS host.
- [ ] `terraform apply` again — it waits for validation, then creates the
      HTTPS listener (TLS 1.3 policy) and flips HTTP to a 301 redirect.

## 5. DNS

- [ ] Point the domain at `terraform output alb_dns_name`
      (ALIAS if your DNS host supports it, else CNAME on a subdomain).

## 6. GitHub

- [ ] Add the three Actions secrets from `terraform output`:
      `AWS_DEPLOY_ROLE_ARN`, `ARTIFACTS_BUCKET`, `HEALTHCHECK_URL`.
- [ ] Optional repo **variable** (not secret): `NEXT_PUBLIC_CLOUDFRONT_URL`
      — public CDN base URL, inlined into the client bundle at build time.
- [ ] (Recommended) Settings → Environments → `production` → required
      reviewers, so deploys need a human click.

## 7. First deploy + seed

- [ ] Push to `main` (or run the Deploy workflow manually) and watch it:
      build → S3 → SSM → health check through the ALB.
- [ ] Seed the database once, from a shell ON the instance (the DB is not
      reachable from anywhere else):
      ```
      aws ssm start-session --target <instance-id> --region ap-south-1
      sudo -i
      set -a; source /opt/app/shared/app.env; set +a
      cd /opt/app/current && runuser -u app -- env DATABASE_URL="$DATABASE_URL" npx --yes tsx prisma/seed.ts
      ```
      `ADMIN_PASSWORD` must be a real value in Parameter Store first —
      otherwise the seed creates the known default password.

## 8. Verify the security posture

- [ ] `curl -I http://<alb-dns>/api/healthz` → 200 (or 301 once HTTPS is on).
- [ ] `aws ssm start-session --target <instance-id>` works; `ssh` to the
      instance's private IP from anywhere does not (no route, no rule, no sshd).
- [ ] GuardDuty console shows the detector enabled with EBS malware
      protection on.
- [ ] Break something on purpose (stop the app service) and confirm the
      alarm email arrives.

## Shell access (the only kind)

```bash
aws ssm start-session --target $(terraform output -raw instance_id) --region ap-south-1
```

Session Manager needs no open port: the agent connects outbound over 443.
If a session won't start, check the instance's egress rules and the SSM
agent's status — do NOT "fix" it by adding an SSH rule.
