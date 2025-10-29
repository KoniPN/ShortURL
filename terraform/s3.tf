resource "aws_s3_bucket" "site" {
  bucket        = "${var.project}-site-${random_id.rand.hex}"
  force_destroy = true
}

resource "random_id" "rand" {
  byte_length = 3
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "public_read" {
  statement {
    sid       = "ReadObjects"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }

  # เพิ่มอันนี้
  statement {
    sid       = "ListBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.site.arn]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}


resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.public_read.json
}

# Upload frontend files
resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.site.id
  key          = "index.html"
  source       = "${path.module}/../frontend/dist/index.html"
  content_type = "text/html"
  etag         = filemd5("${path.module}/../frontend/dist/index.html")
}

resource "aws_s3_object" "favicon" {
  bucket       = aws_s3_bucket.site.id
  key          = "favicon.ico"
  source       = "${path.module}/../frontend/dist/favicon.ico"
  content_type = "image/x-icon"
  etag         = filemd5("${path.module}/../frontend/dist/favicon.ico")
}

resource "aws_s3_object" "error_404" {
  bucket       = aws_s3_bucket.site.id
  key          = "404.html"
  source       = "${path.module}/../frontend/dist/404.html"
  content_type = "text/html"
  etag         = filemd5("${path.module}/../frontend/dist/404.html")
}

# Upload CSS assets
resource "aws_s3_object" "css_files" {
  for_each = fileset("${path.module}/../frontend/dist/assets", "*.css")
  
  bucket       = aws_s3_bucket.site.id
  key          = "assets/${each.value}"
  source       = "${path.module}/../frontend/dist/assets/${each.value}"
  content_type = "text/css"
  etag         = filemd5("${path.module}/../frontend/dist/assets/${each.value}")
  cache_control = "public, max-age=31536000, immutable"
}

# Upload JS assets
resource "aws_s3_object" "js_files" {
  for_each = fileset("${path.module}/../frontend/dist/assets", "*.js")
  
  bucket       = aws_s3_bucket.site.id
  key          = "assets/${each.value}"
  source       = "${path.module}/../frontend/dist/assets/${each.value}"
  content_type = "application/javascript"
  etag         = filemd5("${path.module}/../frontend/dist/assets/${each.value}")
  cache_control = "public, max-age=31536000, immutable"
}
