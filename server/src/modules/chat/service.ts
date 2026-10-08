import { Agent } from '@strands-agents/sdk';
import { BedrockModel } from '@strands-agents/sdk/models/bedrock';
import { createRetrieveTool } from './retrieve-tool';
import { buildSystemPrompt } from './system-prompt';
import { env } from '../../config/env';
import { ChatMessageModel } from './model';

export async function createChatAgent(
  userId: string,
  meetingId: string,
  meetingTitle: string
) {
  const retrieveTool = createRetrieveTool(userId, meetingId);

  const model = new BedrockModel({
    modelId: env.BEDROCK_MODEL_ID,
    region: env.AWS_REGION,
  });

  const agent = new Agent({
    model,
    tools: [retrieveTool],
    systemPrompt: buildSystemPrompt(meetingTitle),
  });

  return agent;
}

export async function saveMessage(data: {
  userId: string;
  meetingId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
}) {
  const msg = new ChatMessageModel(data);
  await msg.save();
  return msg;
}

export async function getChatHistory(userId: string, meetingId: string, limit = 50) {
  return ChatMessageModel.find({ userId, meetingId })
    .sort({ createdAt: 1 })
    .limit(limit);
}
