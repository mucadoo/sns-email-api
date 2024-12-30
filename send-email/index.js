const aws = require('aws-sdk');
const sns = new aws.SNS();

exports.handler = async (event) => {
  try {
    const message = {
      subject: 'Contact Form Submission',
      body: `Name: ${event.name}\nEmail: ${event.email}\nMessage: ${event.message}`
    };
    const params = {
      Message: JSON.stringify(message),
      TopicArn: process.env.SNS_TOPIC_ARN
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
