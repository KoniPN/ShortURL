###############################
# SQS for S3 Events -> EC2
###############################
resource "aws_sqs_queue" "s3_events" {
  name                      = "${var.project}-s3-events"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 86400  # 1 day
  receive_wait_time_seconds  = 20     # long polling
}

# Allow S3 bucket to send messages to this queue
data "aws_iam_policy_document" "sqs_from_s3" {
  statement {
    sid     = "AllowS3ToSend"
    effect  = "Allow"
    principals { 
      type = "Service" 
      identifiers = ["s3.amazonaws.com"] 
    }
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.s3_events.arn]
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_s3_bucket.site.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "s3_events" {
  queue_url = aws_sqs_queue.s3_events.id
  policy    = data.aws_iam_policy_document.sqs_from_s3.json
}
