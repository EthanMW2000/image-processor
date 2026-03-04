# image-processor

Personal project. AWS Lambda that automatically processes photos I upload for my photography portfolio.

When I drop images into `originals/` in my S3 bucket, the Lambda resizes and converts them to WebP, outputting:
- `web/` — optimized for gallery view (1600px wide, 80% quality)
- `thumbnails/` — grid previews (400px wide, 75% quality)

## Stack

- Node.js 22 (Lambda runtime, arm64)
- sharp (image processing)
- AWS SDK v3 (S3 client)
- TypeScript
- Terraform (infrastructure)
- GitHub Actions (CI/CD)

## Local Setup

```
npm install
```

## Build

```
bash scripts/build.sh
```

## Deploy

Pushes to `main` trigger a GitHub Actions workflow that builds and deploys via Terraform.

To deploy manually:

```
bash scripts/build.sh
eval "$(aws configure export-credentials --profile personal --format env)"
cd infra && terraform init && terraform apply
```

## Backfill Existing Images

To process images already in `originals/` (S3 notifications only fire on new PUTs):

```
aws s3 cp s3://ethanwells-photography/originals/ s3://ethanwells-photography/originals/ \
  --recursive --profile personal --region us-east-2
```
