import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'; // Default if not set

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

  console.log('--- Password Reset Email Simulation ---');
  console.log(`To: ${userEmail}`);
  console.log(`Subject: Password Reset Request`);
  console.log(`Body: You requested a password reset. Click this link to reset your password: ${resetLink}`);
  console.log(`Full Reset Link (for testing): ${resetLink}`);
  console.log('--- End of Email Simulation ---');

  return Promise.resolve();
};

/**
 * Sends a group invitation email to an already registered user.
 * @param userEmail The email address of the invited user.
 * @param groupName The name of the group.
 * @param groupId The ID of the group.
 * @param token The invitation token.
 */
export const sendGroupInvitationEmail = async (
  userEmail: string,
  groupName: string,
  groupId: string,
  token: string
): Promise<void> => {
  const acceptLink = `${CLIENT_URL}/accept-group-invite?groupId=${groupId}&token=${token}`;

  console.log('--- Group Invitation Email (Registered User) Simulation ---');
  console.log(`To: ${userEmail}`);
  console.log(`Subject: Você foi convidado para o grupo "${groupName}"!`);
  console.log(`Body: Olá! Você foi convidado para se juntar ao grupo "${groupName}". Clique no link abaixo para aceitar o convite: ${acceptLink}`);
  console.log(`Full Acceptance Link (for testing): ${acceptLink}`);
  console.log('--- End of Email Simulation ---');

  return Promise.resolve();
};

/**
 * Sends a registration invitation email to an unregistered user.
 * @param userEmail The email address of the invited user.
 * @param groupName The name of the group.
 * @param groupId The ID of the group.
 * @param token The invitation token.
 */
export const sendRegistrationInvitationEmail = async (
  userEmail: string,
  groupName: string,
  groupId: string,
  token: string
): Promise<void> => {
  const registerLink = `${CLIENT_URL}/register?groupId=${groupId}&token=${token}&email=${encodeURIComponent(userEmail)}`;

  console.log('--- Registration Invitation Email (Unregistered User) Simulation ---');
  console.log(`To: ${userEmail}`);
  console.log(`Subject: Você foi convidado para o F360 e para o grupo "${groupName}"!`);
  console.log(`Body: Olá! Você foi convidado para se juntar ao F360 e ao grupo "${groupName}". Por favor, registre-se usando o link abaixo para aceitar o convite: ${registerLink}`);
  console.log(`Full Registration Link (for testing): ${registerLink}`);
  console.log('--- End of Email Simulation ---');

  return Promise.resolve();
};
