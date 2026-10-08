import { Request, Response } from 'express';
import { generateSummary } from './service';

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id: meetingId } = req.params;
    
    const result = await generateSummary(meetingId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to get summary:', error);
    if (error.message === 'Meeting not found') {
      res.status(404).json({ error: 'Meeting not found' });
    } else {
      res.status(500).json({ error: error.message || 'Failed to generate summary' });
    }
  }
};
