#####################################
# S3 -> SQS Notification
#####################################
resource "aws_s3_bucket_notification" "site_to_sqs" {
  bucket = aws_s3_bucket.site.id

  queue {
    queue_arn     = aws_sqs_queue.s3_events.arn
    events        = ["s3:ObjectCreated:*"]
    # filter_prefix = "uploads/"
    # filter_suffix = ".json"
  }

  depends_on = [aws_sqs_queue_policy.s3_events]
}
