import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { forgotPassword, resetPassword } from './authController';
import User from '../models/User';
import * as emailService from '../utils/emailService'; // Import like this for easier mocking
import crypto from 'crypto';
import { Request, Response } from 'express';

// Mock an Express request and response
const mockRequest = (body: any = {}, params: any = {}): Partial<Request> => ({
  body,
  params,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// Mock User model
vi.mock('../models/User', () => {
  const mockUserInstance = {
    save: vi.fn().mockResolvedValue(true),
    // Add other methods/properties if needed by the controller
  };
  return {
    default: { // Assuming User is a default export
      findOne: vi.fn().mockResolvedValue(mockUserInstance), // Default mock
      // Add other static methods if needed
    }
  };
});

// Mock emailService
vi.mock('../utils/emailService', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// We will spy on crypto methods in beforeEach/afterEach instead of using vi.mock for the whole module.

describe('Auth Controller - forgotPassword', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let randomBytesSpy: ReturnType<typeof vi.spyOn>;
  let createHashUpdateDigestSpy: ReturnType<typeof vi.spyOn>; // For the chained calls
  let createHashInstanceMock: { update: vi.Mock, digest: vi.Mock };

  beforeEach(() => {
    res = mockResponse();
    vi.clearAllMocks(); // This will also clear mocks for User and emailService if they are auto-mocked or vi.mocked

    // Mock crypto methods
    randomBytesSpy = vi.spyOn(crypto, 'randomBytes').mockImplementation(
      () => ({ toString: vi.fn(() => 'mocked_reset_token') } as any)
    );
    
    // For createHash().update().digest()
    createHashInstanceMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mocked_hashed_token')
    };
    // @ts-ignore
    vi.spyOn(crypto, 'createHash').mockImplementation(() => createHashInstanceMock);
  });

  afterEach(() => {
    // Restore all spied methods
    vi.restoreAllMocks();
  });

  it('should handle a valid email, generate token, save user, and send email', async () => {
    const email = 'test@example.com';
    req = mockRequest({ email });
    
    const mockUser = { 
      email, 
      isActive: true, 
      save: vi.fn().mockResolvedValue(true),
      passwordResetToken: '',
      passwordResetExpires: null,
    };
    (User.findOne as vi.Mock).mockResolvedValue(mockUser);

    await forgotPassword(req as Request, res as Response);

    expect(User.findOne).toHaveBeenCalledWith({ email });
    expect(crypto.randomBytes).toHaveBeenCalledWith(32); // Check if spy was called
    expect(crypto.createHash).toHaveBeenCalledWith('sha256'); // Check if spy was called
    expect(createHashInstanceMock.update).toHaveBeenCalledWith('mocked_reset_token');
    expect(createHashInstanceMock.digest).toHaveBeenCalledWith('hex');
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.passwordResetToken).toBe('mocked_hashed_token');
    expect(mockUser.passwordResetExpires).toBeInstanceOf(Date);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(email, 'mocked_reset_token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  });

  it('should return generic success for unknown email and not send email', async () => {
    const email = 'unknown@example.com';
    req = mockRequest({ email });
    (User.findOne as vi.Mock).mockResolvedValue(null); // User not found

    await forgotPassword(req as Request, res as Response);

    expect(User.findOne).toHaveBeenCalledWith({ email });
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent.",
      })
    );
  });

  // Add more tests:
  // - User found but is inactive
  // - Email sending fails (user token/expiry should be cleared)
  // - Zod validation error

  it('should return generic success if user is inactive and not send email', async () => {
    const email = 'inactive@example.com';
    req = mockRequest({ email });
    const mockUser = { 
      email, 
      isActive: false, // User is inactive
      save: vi.fn().mockResolvedValue(true) 
    };
    (User.findOne as vi.Mock).mockResolvedValue(mockUser);

    await forgotPassword(req as Request, res as Response);

    expect(User.findOne).toHaveBeenCalledWith({ email });
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent.",
      })
    );
    expect(mockUser.save).not.toHaveBeenCalled(); // Should not attempt to save token details
  });

  it('should clear token and expiry if email sending fails', async () => {
    const email = 'emailfail@example.com';
    req = mockRequest({ email });
    
    const mockUser = { 
      email, 
      isActive: true, 
      save: vi.fn().mockResolvedValue(true), // Mock save for user
      passwordResetToken: 'some_initial_token', // Will be overwritten
      passwordResetExpires: new Date(Date.now() + 10000), // Will be overwritten
    };
    (User.findOne as vi.Mock).mockResolvedValue(mockUser);
    (emailService.sendPasswordResetEmail as vi.Mock).mockRejectedValueOnce(new Error('Email failed'));

    await forgotPassword(req as Request, res as Response);
    
    expect(mockUser.save).toHaveBeenCalledTimes(2); // First save for token, second for clearing
    expect(mockUser.passwordResetToken).toBeUndefined();
    expect(mockUser.passwordResetExpires).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200); // Or 500 depending on desired behavior, current code is 200
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent. If you don't receive it, please try again later or contact support.",
      })
    );
  });

  it('should return Zod validation error for invalid email format', async () => {
    const email = 'invalid-email';
    req = mockRequest({ email });

    await forgotPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation error',
        details: expect.any(Array),
      })
    );
    expect(User.findOne).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('Auth Controller - resetPassword', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let createHashSpy: ReturnType<typeof vi.spyOn>;
  let createHashInstanceMock: { update: vi.Mock, digest: vi.Mock };
  let dateNowSpy: ReturnType<typeof vi.spyOn>;
  const FIXED_SYSTEM_TIME = 1748532792000; // A fixed timestamp in ms


  beforeEach(() => {
    res = mockResponse();
    vi.clearAllMocks();

    // Mock Date.now()
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(FIXED_SYSTEM_TIME);

    // Mock crypto's createHash for token hashing
    createHashInstanceMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mocked_hashed_param_token') // Hashed version of the token from req.params
    };
    // @ts-ignore
    createHashSpy = vi.spyOn(crypto, 'createHash').mockImplementation(() => createHashInstanceMock);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // This will restore Date.now as well if spied on with vi.spyOn
  });

  it('should reset password with a valid token and matching passwords', async () => {
    const token = 'valid_reset_token_from_email';
    req = mockRequest(
      { password: 'newPassword123', confirmPassword: 'newPassword123' },
      { token }
    );

    const mockUser = {
      _id: 'userId123',
      password: 'oldHashedPassword',
      passwordResetToken: 'mocked_hashed_param_token', // This should match the output of crypto.createHash()...digest()
      passwordResetExpires: new Date(Date.now() + 3600000), // Expires in 1 hour
      save: vi.fn().mockResolvedValue(true),
    };
    // User.findOne should be mocked to return this user when queried with the hashed token and expiry
    (User.findOne as vi.Mock).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser) // Mock the .select() chaining
    });


    await resetPassword(req as Request, res as Response);

    expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    expect(createHashInstanceMock.update).toHaveBeenCalledWith(token);
    expect(createHashInstanceMock.digest).toHaveBeenCalledWith('hex');
    
    // Capture the argument passed to User.findOne
    const findOneArg = (User.findOne as vi.Mock).mock.calls[0][0];
    expect(findOneArg.passwordResetToken).toBe('mocked_hashed_param_token');
    // The controller uses Date.now(), which is a number, so we expect a number here.
    expect(findOneArg.passwordResetExpires.$gt).toBe(FIXED_SYSTEM_TIME);
    
    // We also need to ensure the .select() part of the mock is correctly set up
    // The current mock for User.findOne is:
    // (User.findOne as vi.Mock).mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) });
    // We need to check if the .select() was called.
    expect((User.findOne as vi.Mock).getMockImplementation()().select)
        .toHaveBeenCalledWith('+passwordResetToken +passwordResetExpires');


    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.password).toBe('newPassword123'); // Password set before hashing (pre-save hook handles hashing)
    expect(mockUser.passwordResetToken).toBeUndefined();
    expect(mockUser.passwordResetExpires).toBeUndefined();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Password has been reset successfully.",
    });
  });

  it('should return 400 for invalid or expired token', async () => {
    const token = 'invalid_or_expired_token';
    req = mockRequest(
      { password: 'newPassword123', confirmPassword: 'newPassword123' },
      { token }
    );
    
    (User.findOne as vi.Mock).mockReturnValue({
        select: vi.fn().mockResolvedValue(null) // Simulate token not found or expired
    });

    await resetPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid or expired password reset token. Please try resetting your password again.",
    });
  });

  it('should return Zod validation error for non-matching passwords', async () => {
    const token = 'valid_token';
    req = mockRequest(
      { password: 'newPassword123', confirmPassword: 'wrongConfirmPassword' },
      { token }
    );

    await resetPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: 'Passwords do not match',
            path: ['confirmPassword'],
          }),
        ]),
      })
    );
    expect(User.findOne).not.toHaveBeenCalled(); // Should fail before DB lookup if Zod validation is correct
  });
  
  // Add test for user not found even if token is technically valid (edge case, db inconsistency)
  // Add test for .save() failing
});
