import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'; // Default if not set

interface UserEmailDetails {
  email: string;
  name?: string; // Optional: for personalizing the email
}

/**
 * Sends a password reset email (logs to console for now).
 * @param userEmail The email address of the user.
 * @param resetToken The password reset token (unhashed).
 */
export const sendPasswordResetEmail = async (
  userEmail: string,
  resetToken: string
): Promise<void> => {
  const resetLink = `${CLIENT_URL}/reset-password/${resetToken}`;

  // In a real application, you would use an email sending service here.
  // For example, using Nodemailer:
  //
  // import nodemailer from 'nodemailer';
  //
  // const transporter = nodemailer.createTransport({
  //   host: process.env.EMAIL_HOST,
  //   port: Number(process.env.EMAIL_PORT),
  //   secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS,
  //   },
  // });
  //
  // const mailOptions = {
  //   from: `"Your App Name" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
  //   to: userEmail,
  //   subject: 'Password Reset Request',
  //   text: `You requested a password reset. Click this link to reset your password: ${resetLink}`,
  //   html: `<p>You requested a password reset. Click this link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
  // };
  //
  // try {
  //   await transporter.sendMail(mailOptions);
  //   console.log('Password reset email sent (simulated) to:', userEmail);
  // } catch (error) {
  //   console.error('Error sending password reset email (simulated):', error);
  //   throw new Error('Could not send password reset email.');
  // }

  // For now, just log to the console:
  console.log('--- Password Reset Email Simulation ---');
  console.log(`To: ${userEmail}`);
  console.log(`Subject: Password Reset Request`);
  console.log(`Body: You requested a password reset. Click this link to reset your password: ${resetLink}`);
  console.log(`Full Reset Link (for testing): ${resetLink}`);
  console.log('--- End of Email Simulation ---');

  // Simulate async operation if needed, though console.log is sync
  return Promise.resolve();
};
