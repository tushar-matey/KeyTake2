import { User } from './model';

export const findOrCreateUser = async (cognitoSub: string, email: string) => {
  let user = await User.findOne({ cognitoSub });
  
  if (!user) {
    user = await User.create({
      cognitoSub,
      email: email || 'unknown@example.com', // fallback if email is not available in access token
    });
  }
  
  return user;
};
