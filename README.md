# 📬 Contact Form Email Service

A serverless contact form backend built on AWS — Lambda, SNS, and API Gateway — provisioned with Terraform and deployed automatically via GitHub Actions.

---

## Architecture Overview

```
Client (HTML Form)
      │
      ▼ POST /send-email
┌─────────────────────┐
│   API Gateway (HTTP) │  ← throttled: 10 req/s, burst 5
└─────────┬───────────┘
          │ AWS_PROXY
          ▼
┌─────────────────────┐
│   Lambda Function    │  ← Node.js 22.x
│   (send-email)       │  validates + sanitizes input
└─────────┬───────────┘
          │ sns:Publish
          ▼
┌─────────────────────┐
│     SNS Topic        │
└─────────┬───────────┘
          │ email subscription
          ▼
    📧 Your Inbox
```

---

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── send-email/
│   ├── index.js                # Lambda handler
│   ├── package.json
│   └── package-lock.json
└── terraform/
    ├── main.tf                 # All AWS resources
    ├── variables.tf
    └── outputs.tf
```

---

## Features

- **Input validation** — email format, name/subject (1–100 chars), message (1–1000 chars)
- **Input sanitization** — all fields HTML-escaped before publishing
- **CORS configured** — API Gateway accepts cross-origin requests
- **Rate limiting** — 10 requests/second, burst of 5
- **CloudWatch logging** — 14-day log retention for the Lambda
- **Automated deploys** — push to `main` → build → plan → apply

---

## Prerequisites

- AWS account with programmatic access
- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5.0
- Node.js 22.x
- GitHub repository with Actions enabled

---

## Setup

### 1. Configure GitHub Secrets

In your repository go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |

The IAM user needs permissions for Lambda, SNS, IAM, API Gateway, CloudWatch, and S3 (for Terraform state if remote).

### 2. Set the recipient email

The notification email defaults to `samuelgiordano@live.com`. To change it, edit `terraform/variables.tf`:

```hcl
variable "email_endpoint" {
  default = "your@email.com"
}
```

Or pass it at apply time:

```bash
terraform apply -var="email_endpoint=your@email.com"
```

### 3. Confirm the SNS subscription

After the first deploy, AWS sends a confirmation email to the configured address. **You must click the confirmation link** before any notifications will be delivered.

---

## Deployment

### Automatic (recommended)

Push to `main` and the GitHub Actions workflow handles everything:

1. Installs Lambda dependencies
2. Zips the function code
3. Configures AWS credentials
4. Runs `terraform init → plan → apply`

### Manual

```bash
# Install Lambda dependencies and zip
cd send-email
npm install
zip -r ../terraform/lambda_function_payload.zip .

# Provision infrastructure
cd ../terraform
terraform init
terraform plan
terraform apply
```

---

## API Reference

### `POST /send-email`

**Endpoint:** `{api_endpoint}/prod/send-email`

The API Gateway URL is printed as a Terraform output after deployment:
```bash
terraform output api_endpoint
```

**Request body:**

```json
{
  "name":    "Jane Doe",
  "email":   "jane@example.com",
  "subject": "Hello there",
  "message": "Your message here."
}
```

**Validation rules:**

| Field | Rules |
|---|---|
| `email` | Must be a valid email address |
| `name` | 1–100 characters |
| `subject` | 1–100 characters |
| `message` | 1–1000 characters |

**Responses:**

| Status | Body | Meaning |
|---|---|---|
| `200` | `"Email sent successfully!"` | Message published to SNS |
| `500` | `"Internal server error"` | Validation failed or AWS error |

**Example request:**

```bash
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Hello",
    "message": "Reaching out from your site."
  }'
```

---

## Infrastructure Details

All resources are defined in `terraform/main.tf`.

| Resource | Name | Notes |
|---|---|---|
| SNS Topic | `email-notifications` | Fan-out to email |
| SNS Subscription | — | Email protocol |
| IAM Role | `email-lambda-role` | Least-privilege |
| Lambda | `send-email-function` | Node.js 22.x |
| CloudWatch Log Group | `/aws/lambda/send-email-function` | 14-day retention |
| API Gateway | `EmailAPI` | HTTP API (v2) |
| API Stage | `prod` | Auto-deploy enabled |

**Terraform outputs:**

```bash
terraform output api_endpoint   # API Gateway base URL
terraform output sns_topic_arn  # SNS topic ARN
```

---

## Local Development

```bash
cd send-email
npm install

# Test the handler locally with a mock event
node -e "
const handler = require('./index');
handler.handler({
  body: JSON.stringify({
    name: 'Test',
    email: 'test@example.com',
    subject: 'Hello',
    message: 'Testing locally'
  })
}).then(console.log);
"
```

> **Note:** Local runs will fail at the SNS publish step unless `SNS_TOPIC_ARN` is set and valid AWS credentials are available in the environment.

---

## Security Notes

- All user input is validated with the [`validator`](https://github.com/validatorjs/validator.js) library before processing
- All fields are HTML-escaped via `validator.escape()` before being included in the SNS message
- The Lambda IAM role follows least privilege — it can only publish to its own SNS topic and write CloudWatch logs
- CORS is currently set to `allow_origins = ["*"]`; restrict this to your domain in production
- Consider adding an API key or WAF in front of API Gateway for production workloads

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `aws-sdk` | ^2.1692.0 | AWS service client (SNS) |
| `validator` | ^13.12.0 | Input validation & sanitization |

---

## License

MIT