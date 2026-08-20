# Infrastructure

Hardened AWS deployment for the italian-shoes app, designed around the
failure mode that actually happened here twice: a security group with
`0.0.0.0/0` inbound on a service port, followed by cryptominers.

## Invariants (do not weaken)

1. No `0.0.0.0/0` ingress anywhere except the ALB on 80/443.
2. No SSH. No port 22 rule, no key pair, no private key anywhere.
   Instance access is `aws ssm start-session` only.
3. No long-lived AWS credentials. GitHub deploys via OIDC; the instance
   uses its role; humans use their own identities.
4. No secrets in git. Runtime config lives in SSM Parameter Store under
   `/italian-shoes/` and is pulled at service start.
5. App runs as the unprivileged `app` user under a sandboxed systemd unit.
6. IMDSv2 required, hop limit 1.
7. Egress restricted to 443/80, DNS (UDP 53 to the VPC resolver),
   PostgreSQL to the RDS SG, and SMTP 587 (deliberate, port-scoped).

## Layout

| File | Contents |
|---|---|
| `versions.tf` | Terraform/provider pins, provider + default tags, backend (commented) |
| `variables.tf` | All inputs; see `terraform.tfvars.example` |
| `network.tf` | VPC 10.20.0.0/16, 2 public + 2 private subnets, IGW, single NAT, flow logs |
| `security.tf` | The three security groups, one rule per resource |
| `compute.tf` | AL2023 arm64 instance, instance role, user-data bootstrap |
| `templates/user_data.sh.tftpl` | Bootstrap: SSM, no-sshd, dnf-automatic, Node 20, app user, sandboxed unit, AIDE, CloudWatch agent |
| `alb.tf` | ALB, target group, ACM (gated on `domain_name`), listeners |
| `rds.tf` | PostgreSQL, private, encrypted, deletion-protected |
| `parameters.tf` | SSM parameters: managed values + CHANGEME placeholders |
| `artifacts.tf` | Versioned, private release-artifacts bucket |
| `github_oidc.tf` | OIDC provider + deploy role pinned to one repo/branch |
| `monitoring.tf` | GuardDuty (+EBS malware), SNS alerts, EventBridge, alarms, budget |
| `scripts/deploy-remote.sh` | Runs on the instance via SSM: verify, migrate, swap, restart, prune |
| `outputs.tf` | Everything the checklist needs |

## State backend

State contains the RDS master password — treat the bucket accordingly.
Create it once (pick a globally unique name):

```bash
aws s3api create-bucket \
  --bucket italian-shoes-tfstate-<ACCOUNT_ID> \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

aws s3api put-bucket-versioning \
  --bucket italian-shoes-tfstate-<ACCOUNT_ID> \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket italian-shoes-tfstate-<ACCOUNT_ID> \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block \
  --bucket italian-shoes-tfstate-<ACCOUNT_ID> \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Then uncomment the `backend "s3"` block in `versions.tf`, put the bucket
name in, and run `terraform init -migrate-state`.

## Day-to-day

```bash
cd infra
terraform init
terraform plan -out=tfplan   # review — especially any security-group change
# apply is run by the owner, never by automation
```

Deploys happen from GitHub Actions (`.github/workflows/deploy.yml`) on push
to `main`: build on the runner → artifact to S3 → SSM Run Command on the
instance. Nothing inbound, ever. Full go-live steps: `DEPLOY_CHECKLIST.md`.

Shell on the box:

```bash
aws ssm start-session --target $(cd infra && terraform output -raw instance_id) --region ap-south-1
```
