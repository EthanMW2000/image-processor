# image-processor

AWS Lambda function that processes uploaded photos for the portfolio photography page.

Triggered by S3 PUT events on `originals/` in the `ethanwells-photography` bucket. Resizes and converts images to WebP, outputting:
- `web/` — optimized for gallery view (1600px max, 80% quality)
- `thumbnails/` — grid previews (400px max, 75% quality)

## Stack

- Node.js 20 (Lambda runtime)
- sharp (image processing)
- AWS SDK v3 (S3 client)
- TypeScript

## Setup

```
npm install
```

## Build

```
npx tsc
```

## Deploy

```
cd dist && zip -r ../function.zip . && cd ..
zip -r function.zip node_modules/

aws lambda update-function-code \
  --function-name image-processor \
  --zip-file fileb://function.zip \
  --profile personal
```
