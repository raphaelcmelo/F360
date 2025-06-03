import { describe, it, expect } from 'vitest';
import User from './User'; // Assuming path to your User model
import mongoose from 'mongoose';

describe('User Model', () => {
  it('should correctly remove password, passwordResetToken, passwordResetExpires, and __v from toJSON output', () => {
    // Create a new User instance with all fields, including those that should be removed.
    // No need to actually save to DB for toJSON testing.
    const userData = {
      _id: new mongoose.Types.ObjectId().toString(),
      email: 'test@example.com',
      password: 'hashedpassword123', // This would be hashed in reality
      name: 'Test User',
      role: 'user',
      isActive: true,
      passwordResetToken: 'sometoken',
      passwordResetExpires: new Date(Date.now() + 3600000), // Expires in 1 hour
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0, // Version key
    };

    // Cast to any to satisfy constructor if it expects a Document.
    // Or, if your User model can be instantiated directly:
    const user = new User(userData); 
    
    // Alternatively, if User is just an interface and mongoose.model('User', userSchema) is used,
    // we might need to create a plain object and call toJSON if the method is part of the schema options.
    // However, userSchema.methods.toJSON implies it's an instance method.

    const jsonUser = user.toJSON();

    expect(jsonUser).not.toHaveProperty('password');
    expect(jsonUser).not.toHaveProperty('passwordResetToken');
    expect(jsonUser).not.toHaveProperty('passwordResetExpires');
    expect(jsonUser).not.toHaveProperty('__v');

    // Check that other properties are still there
    expect(jsonUser).toHaveProperty('email', userData.email);
    expect(jsonUser).toHaveProperty('name', userData.name);
    expect(jsonUser).toHaveProperty('_id'); // Mongoose typically adds 'id' virtual, but _id might be present or transformed
  });

  // Add other model-specific tests if needed, e.g., for custom methods or virtuals.
  // Testing pre-save hooks (like password hashing) is more of an integration test
  // with an in-memory database, which can be complex to set up here.
});
