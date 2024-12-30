## Deploy

```
npm i
sam deploy --template-file template.yaml --stack-name send-email --s3-bucket mucadoo-cloudformation --region us-east-2 --capabilities CAPABILITY_NAMED_IAM --profile mucadoo