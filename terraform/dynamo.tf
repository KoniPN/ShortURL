# DynamoDB Table for URL Shortener
resource "aws_dynamodb_table" "urls" {
  name         = "${var.project}-urls"
  billing_mode = "PAY_PER_REQUEST" # Auto-scaling, pay only for what you use
  hash_key     = "shortCode"       # Primary key

  attribute {
    name = "shortCode"
    type = "S" # String
  }

  # Optional: Add GSI for querying URLs by userId
  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Enable encryption at rest
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project}-urls-table"
    Environment = var.environment
    Project     = var.project
  }
}

# DynamoDB Table for Users
resource "aws_dynamodb_table" "users" {
  name         = "${var.project}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  # GSI for querying by email
  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project}-users-table"
    Environment = var.environment
    Project     = var.project
  }
}
