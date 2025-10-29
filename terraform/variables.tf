variable "project" {
  description = "Project name"
  type        = string
  default     = "cloudurlshorter"
}

variable "aws_access_key" {}
variable "aws_secret_key" {}
variable "aws_session_token" {}
variable "key_name" {}
variable "region" {
  default = "us-east-1"
}
variable "network_address_space" {
  default = "10.0.0.0/16"
}
variable "ami_id" {
  description = "AMI for EC2"
  type        = string
  default     = "ami-08982f1c5bf93d976"
}
variable "instance_count" {
  description = "Number of EC2 Instance that auto scaling will create"
  type        = number
  default     = 2
}
variable "web_bucket_name" {
  description = "S3 bucket ที่เก็บไฟล์เว็บ (static)"
  type        = string
  default     = "cloudurlshorter-site-046708"
}
variable "web_bucket_prefix" {
  description = "โฟลเดอร์ย่อยในบัคเก็ต ถ้าไม่มีปล่อยว่าง"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "jwt_secret" {
  description = "Secret key for JWT token signing"
  type        = string
  sensitive   = true
}