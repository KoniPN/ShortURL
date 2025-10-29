output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.alb.dns_name
}

output "s3_website_endpoint" {
  description = "S3 website endpoint URL"
  value       = aws_s3_bucket_website_configuration.site.website_endpoint
}

output "dynamodb_urls_table_name" {
  description = "DynamoDB table name for URLs"
  value       = aws_dynamodb_table.urls.name
}

output "dynamodb_urls_table_arn" {
  description = "DynamoDB table ARN for URLs"
  value       = aws_dynamodb_table.urls.arn
}

output "dynamodb_users_table_name" {
  description = "DynamoDB table name for Users"
  value       = aws_dynamodb_table.users.name
}

output "dynamodb_users_table_arn" {
  description = "DynamoDB table ARN for Users"
  value       = aws_dynamodb_table.users.arn
}
