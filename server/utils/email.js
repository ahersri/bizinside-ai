const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // For development, use Ethereal email (fake SMTP)
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'your_ethereal_email',
      pass: 'your_ethereal_password'
    }
  });

  // For production, use real email service
  // const transporter = nodemailer.createTransport({
  //   service: 'Gmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS
  //   }
  // });

  const message = {
    from: '"bizinside.ai" <noreply@bizinside.ai>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
  return info;
};

module.exports = sendEmail;