import { Request, Response } from 'express';
import { User } from './model';

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ cognitoSub: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.cognitoSub,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
