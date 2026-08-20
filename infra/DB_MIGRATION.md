# One-time migration: old us-east-1 DB → new private ap-south-1 RDS

Why: the old `italian-shoes-db` (us-east-1) is publicly accessible with
5432 open to `0.0.0.0/0`, and its master password lived on both compromised
instances. The data moves; the instance retires. Decision recorded
2026-08-21 (option A).

Order matters. The old DB stays untouched and serving until step 6.

## 1. Rotate the old DB password (again, to a random one)

The first rotation's password was typed inline and is in shell history —
treat it as burned. Once status is `available`:

```bash
aws rds modify-db-instance --db-instance-identifier italian-shoes-db \
  --region us-east-1 --profile italian-shoes \
  --master-user-password "$(openssl rand -base64 24 | tr -d '/+=' | tee /tmp/old-db-pass.txt)" \
  --apply-immediately
cat /tmp/old-db-pass.txt   # you'll paste this into the dump script's prompt
```

Delete `/tmp/old-db-pass.txt` after the migration.

## 2. Create the new RDS (Postgres 18.6)

```bash
cd infra && AWS_PROFILE=italian-shoes terraform apply tfplan
```

~10–15 minutes. Creates the private instance and the SecureString
`DATABASE_URL` parameter.

## 3. Dump + upload (laptop)

```bash
./scripts/db-migrate-dump.sh
```

Prompts for the step-1 password; dumps with `--no-owner --no-privileges`
(the new DB's master user is `app_admin`, not `postgres`); gzips; uploads
dump + restore script to the private artifacts bucket. Nothing sensitive
touches the command line or disk outside a mktemp dir.

## 4. Restore (SSM session on the instance)

Use the exact commands the dump script prints: session in, `sudo -i`,
download `db-migrate-restore.sh` from the bucket, run it with the printed
`DUMP_KEY`. It pulls `DATABASE_URL` from Parameter Store, restores with
`ON_ERROR_STOP=1`, then prints per-table row counts and the
`_prisma_migrations` history.

## 5. Verify

- Row counts match the old DB (spot-check from your laptop:
  `psql -h italian-shoes-db.conyuyc0gfdn.us-east-1.rds.amazonaws.com -U postgres -d italianshoes -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;"`).
- `_prisma_migrations` lists the same migrations as `prisma/migrations/`.
- After the first deploy: log in to the app, open an order, load a product
  with its 3D model.

## 6. Delete the dump, retire the old DB

```bash
# the dump is a full copy of production data — remove it once verified
aws s3 rm s3://italian-shoes-artifacts-145023126353/migration/ --recursive --profile italian-shoes

# final snapshot, then delete the old instance
aws rds delete-db-instance --db-instance-identifier italian-shoes-db \
  --region us-east-1 --profile italian-shoes \
  --final-db-snapshot-identifier italian-shoes-db-retired-2026
```

The snapshot keeps the data recoverable; the public 5432 endpoint dies with
the instance. If anything else uses that DB's VPC/security group
(`sg-0a440ec3564c4cc93`), clean those up separately.

## Notes

- New DB name is `italian_shoes` (old was `italianshoes`) — irrelevant to
  the app, which reads the full `DATABASE_URL` from Parameter Store.
- The deploy pipeline's `prisma migrate deploy` will no-op afterwards as
  long as old prod ran the same migration history as this repo.
- Do NOT point anything at the old endpoint after step 6 — it no longer
  exists, by design.
