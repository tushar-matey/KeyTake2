import { Request, Response } from 'express';
import { Meeting } from '../meetings/model';
import { createChatAgent, saveMessage, getChatHistory } from './service';
import { checkChatQuota, incrementChatQuota } from '../quotas/service';

export async function chatStream(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { message } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const meeting = await Meeting.findOne({ _id: id, userId });
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const isAllowed = await checkChatQuota(userId);
    if (!isAllowed) {
      res.status(429).json({ error: 'Daily chat quota exceeded' });
      return;
    }
    await incrementChatQuota(userId);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush headers to establish SSE

    // Save user message
    await saveMessage({
      userId,
      meetingId: id,
      role: 'user',
      content: message,
    });

    const agent = await createChatAgent(userId, id, meeting.title);
    
    // Get history and format it for the agent
    // Typically agent history is in a specific format
    const history = await getChatHistory(userId, id, 10); // last 10 messages
    const formattedHistory = history.map(h => ({
      role: h.role,
      content: [{ text: h.content }],
    }));

    let fullResponse = '';
    
    // Call agent using runStream or generateStream
    const stream = agent.stream([
      ...formattedHistory as any[],
      { role: 'user', content: [{ text: message }] }
    ]);

    for await (const streamEvent of stream) {
      if (streamEvent.type === 'modelStreamUpdateEvent') {
        const modelEvent = streamEvent.event;
        if (modelEvent.type === 'modelContentBlockDeltaEvent' && modelEvent.delta.type === 'textDelta') {
          const chunk = modelEvent.delta.text;
          fullResponse += chunk;
          res.write(`event: token\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      }
    }

    // After done, save the assistant message
    const savedMsg = await saveMessage({
      userId,
      meetingId: id,
      role: 'assistant',
      content: fullResponse,
      // citations could be parsed from fullResponse or from tool calls if the SDK exposes them
    });

    res.write(`event: done\ndata: ${JSON.stringify({ messageId: savedMsg._id })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('Chat stream error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    res.end();
  }
}

export async function getHistory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const limit = Number(req.query.limit) || 50;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const meeting = await Meeting.findOne({ _id: id, userId });
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const history = await getChatHistory(userId, id, limit);
    res.json(history);
  } catch (error: any) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
