const aws = require('aws-sdk');
const sns = new aws.SNS();
const validator = require('validator');

exports.handler = async (event) => {
  console.log('Lambda function invoked');

  try {
    const body = JSON.parse(event.body);

    // Validate inputs
    if (!validator.isEmail(body.email)) {
      throw new Error('Invalid email address');
    }
    if (!validator.isLength(body.name, { min: 1, max: 100 })) {
      throw new Error('Invalid name');
    }
    if (!validator.isLength(body.subject, { min: 1, max: 100 })) {
      throw new Error('Invalid subject');
    }
    if (!validator.isLength(body.message, { min: 1, max: 1000 })) {
      throw new Error('Invalid message');
    }

    const message = `
      Contact Form Submission
      -------------------------
      Name: ${validator.escape(body.name)}
      Email: ${validator.escape(body.email)}
      Subject: ${validator.escape(body.subject)}
      Message: ${validator.escape(body.message)}
    `;

    const params = {
      Message: message,
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'New Contact Form Submission'
    };

    await sns.publish(params).promise();

    const response = {
      statusCode: 200,
      body: JSON.stringify('Email sent successfully!'),
    };
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Internal server error'),
    };
  }
};
