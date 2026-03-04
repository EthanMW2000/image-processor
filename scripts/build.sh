#!/bin/bash
set -euo pipefail

rm -rf dist
mkdir -p dist/bundle

npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --target=es2023 \
  --outfile=dist/bundle/index.js \
  --format=cjs \
  --external:sharp

cd dist/bundle
npm init -y > /dev/null 2>&1
npm install --force --os=linux --cpu=arm64 --libc=glibc sharp > /dev/null 2>&1
zip -rq ../lambda.zip .
