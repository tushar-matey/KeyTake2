import { Request, Response } from 'express';
import { createMeeting, listMeetings, getMeeting, deleteMeeting, getMeetingStatus } from './service';
import { createMeetingSchema } from '@keytake/shared';

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title } = createMeetingSchema.parse(req.body);
    
    const meeting = await createMeeting(userId, title);
    res.json(meeting);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const meetings = await listMeetings(userId);
    res.json(meetings);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const get = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const meeting = await getMeeting(userId, id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const meeting = await deleteMeeting(userId, id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const meeting = await getMeetingStatus(userId, id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json({ status: meeting.status, errorMessage: meeting.errorMessage });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
