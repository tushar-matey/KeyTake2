import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { env } from '../../config/env';

/**
 * Factory that creates a retrieve tool with userId and meetingId
 * CLOSED OVER so the model cannot see or change them.
 */
export function createRetrieveTool(userId: string, meetingId: string) {
  return tool({
    name: 'retrieve_meeting_content',
    description: 'Search the meeting knowledge base for relevant content. Use this to answer questions about the meeting.',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant meeting content'),
    }),
    callback: async ({ query }) => {
      const client = new BedrockAgentRuntimeClient({ region: env.AWS_REGION });

      const response = await client.send(new RetrieveCommand({
        knowledgeBaseId: env.BEDROCK_KB_ID,
        retrievalQuery: { text: query },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 6, // 5-8 range
            filter: {
              andAll: [
                { equals: { key: 'userId', value: userId } },
                { equals: { key: 'meetingId', value: meetingId } },
              ],
            },
          },
        },
      }));

      // Format results as readable text instead of raw JSON
      if (!response.retrievalResults || response.retrievalResults.length === 0) {
        return "No results found.";
      }

      const formattedResults = response.retrievalResults.map((r: any, idx: number) => {
        const text = r.content?.text ?? '';
        const uri = r.location?.s3Location?.uri ?? '';
        const fileName = uri.split('/').pop() || 'unknown_file';
        return `--- Result ${idx + 1} ---\nSource File: ${fileName}\nContent:\n${text}\n`;
      }).join('\n');

      return formattedResults;
    },
  });
}
