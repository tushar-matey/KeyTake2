import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { env } from '../../config/env';
import { Meeting } from '../meetings/model';
import { deleteMeeting } from '../meetings/service';

const cognitoClient = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

export const deleteUserAccount = async (userId: string) => {
  // 1. Find all meetings for the user and delete them to clean up S3 and KB
  const meetings = await Meeting.find({ userId });
  for (const meeting of meetings) {
    await deleteMeeting(userId, meeting._id.toString());
  }

  // 2. Delete user from Cognito
  // Wait, Cognito AdminDeleteUser requires Username (which is the sub or username)
  // Our userId is the sub from Cognito token
  if (env.COGNITO_USER_POOL_ID) {
    try {
      await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID,
        Username: userId,
      }));
    } catch (e: any) {
      console.error('Failed to delete Cognito user:', e);
      // If the user doesn't exist in Cognito, that's fine, we still clean up their data.
    }
  }

  // 3. User is not stored in our DB explicitly (we don't have a User model), 
  // but if we had one, we would delete it here.
  // We've already deleted all their meetings (and chat history within deleteMeeting).
};
