import { createTransport } from 'nodemailer';

const transporter = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

export class EmailService {
  async sendEmail(
    recipientEmail: string,
    subject: string,
    text?: string,
    html?: string,
    attachment?: Buffer
  ) {
    const mailOptions: any = {
      from: ` "SkyWings Airline" <${process.env.EMAIL_USER}>`, // sender address
      to: recipientEmail, // list of receivers
      subject, // Subject line
      text: text || '', // plain text body
      html: html || '', // html body
    };
  
    if (attachment) {
      mailOptions.attachments = [
        {
          filename: 'pasabordo.pdf',
          content: attachment,
        },
      ];
    }
  
    const info = await transporter.sendMail(mailOptions);
  
    return info;
  }
}
