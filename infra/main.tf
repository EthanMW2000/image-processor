terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket = "ethanwells-terraform-state"
    key    = "image-processor/terraform.tfstate"
    region = "us-east-2"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_profile" {
  type    = string
  default = null
}

provider "aws" {
  region  = "us-east-2"
  profile = var.aws_profile
}

data "aws_caller_identity" "current" {}

data "aws_iam_role" "lambda_role" {
  name = "image-processor"
}

data "aws_s3_bucket" "photography" {
  bucket = "ethanwells-photography"
}

resource "aws_lambda_function" "processor" {
  function_name = "image-processor"
  role          = data.aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  package_type  = "Zip"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 60
  filename      = "${path.module}/../dist/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/../dist/lambda.zip")
}

resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = data.aws_s3_bucket.photography.arn
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_s3_bucket_notification" "originals" {
  bucket = data.aws_s3_bucket.photography.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "originals/"
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}
