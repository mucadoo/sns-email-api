variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "email_endpoint" {
  description = "The email address to receive SNS notifications"
  type        = string
  default     = "samuelgiordano@live.com"
}
