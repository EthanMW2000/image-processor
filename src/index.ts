import type awsLambda = require("aws-lambda");
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({ region: "us-east-2" });

const OUTPUT_CONFIGS = [
  { prefix: "web", width: 1600, quality: 80 },
  { prefix: "thumbnails", width: 400, quality: 75 },
] as const;

function deriveOutputKey(encodedKey: string) {
  const decodedKey = decodeURIComponent(
    encodedKey.replaceAll("+", " "),
  ).replace("originals/", "");

  const extensionIndex = decodedKey.lastIndexOf(".");
  const key = decodedKey.slice(0, extensionIndex);
  return key + ".webp";
}

function parseS3Event(records: awsLambda.S3EventRecord[]) {
  const files = records.flatMap((r) =>
    r.s3.object.key.startsWith("originals/")
      ? [
          {
            sourceKey: r.s3.object.key,
            outputKey: deriveOutputKey(r.s3.object.key),
          },
        ]
      : [],
  );

  const bucketName = records[0]?.s3.bucket.name;

  return { bucketName, files };
}

async function fetchImage(bucket: string, key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  const bytes = await response.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

async function processImage(
  source: Buffer,
  width: number,
  quality: number,
): Promise<Buffer> {
  return sharp(source)
    .resize({ width, withoutEnlargement: true })
    .withMetadata()
    .webp({ quality })
    .toBuffer();
}

async function uploadImage(
  bucket: string,
  key: string,
  body: Buffer,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
    }),
  );
}

export const handler: awsLambda.S3Handler = async (event) => {
  const { bucketName, files } = parseS3Event(event.Records);

  if (!bucketName || files.length === 0) return;

  for (const file of files) {
    const source = await fetchImage(bucketName, file.sourceKey);

    for (const config of OUTPUT_CONFIGS) {
      const processed = await processImage(source, config.width, config.quality);
      await uploadImage(bucketName, `${config.prefix}/${file.outputKey}`, processed);
    }
  }
};
