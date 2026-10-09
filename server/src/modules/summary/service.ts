import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { bedrockRuntimeClient } from '../../config/bedrock';
import { env } from '../../config/env';
import { Meeting } from '../meetings/model';
import { TranscriptSegment } from '@keytake/shared';

const s3Client = new S3Client({ region: env.AWS_REGION });

function buildSummaryPrompt(transcript: string): string {
  return `You are a meeting summarizer. Given the transcript below, produce a structured summary with:
1. **Meeting Overview** (2-3 sentences)
2. **Key Discussion Points** (bullet points)
3. **Decisions Made** (bullet points, if any)
4. **Action Items** (bullet points with assignee if identifiable, if any)
5. **Notable Quotes** (with speaker label and timestamp, if any)

Rules:
- Use only information from the transcript. Do not invent details.
- Reference speakers by their labels (e.g., Speaker 0, Speaker 1).
- Keep the summary concise but comprehensive.
- Format timestamps as mm:ss.

Transcript:
${transcript}`;
}

async function fetchBDATranscript(meetingId: string): Promise<{ text: string; segments: TranscriptSegment[] }> {
  // BDA stores output in the derived bucket at:
  // bda-output/{meetingId}/<invocationId>/0/standard_output/0/result.json
  // We need to list objects with prefix `bda-output/${meetingId}/` to find the exact key.
  
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  
  const listParams = {
    Bucket: env.S3_DERIVED_BUCKET,
    Prefix: `bda-output/${meetingId}/`,
  };
  
  const listRes = await s3Client.send(new ListObjectsV2Command(listParams));
  const resultJsonObj = listRes.Contents?.find(c => c.Key?.endsWith('result.json'));
  
  if (!resultJsonObj || !resultJsonObj.Key) {
    throw new Error('BDA transcript output not found in S3');
  }

  const getParams = {
    Bucket: env.S3_DERIVED_BUCKET,
    Key: resultJsonObj.Key,
  };
  
  const getRes = await s3Client.send(new GetObjectCommand(getParams));
  const bodyStr = await getRes.Body?.transformToString();
  
  if (!bodyStr) {
    throw new Error('Empty BDA transcript output');
  }

  const resultData = JSON.parse(bodyStr);
  
  const segments: TranscriptSegment[] = [];
  let fullText = '';
  
  if (resultData.audio_segments && Array.isArray(resultData.audio_segments)) {
    for (const seg of resultData.audio_segments) {
      segments.push({
        segmentIndex: seg.segment_index,
        startTimestampMs: seg.start_timestamp_millis,
        endTimestampMs: seg.end_timestamp_millis,
        text: seg.text,
        speaker: seg.speaker?.speaker_label || 'Unknown',
      });
      fullText += `[${seg.speaker?.speaker_label || 'Unknown'}] ${seg.text}\n`;
    }
  }

  return { text: fullText, segments };
}

export async function generateSummary(meetingId: string, userId: string): Promise<{ summary: string; transcript: TranscriptSegment[] }> {
  // 1. Check if summary already cached in Mongo → return it
  const meeting = await Meeting.findOne({ _id: meetingId, userId });
  if (!meeting) {
    throw new Error('Meeting not found');
  }
  
  if (meeting.summary && meeting.transcript && meeting.transcript.length > 0) {
    return {
      summary: meeting.summary,
      transcript: meeting.transcript as TranscriptSegment[],
    };
  }

  // 2. Fetch BDA transcript output from derived bucket
  const { text: transcriptText, segments } = await fetchBDATranscript(meetingId);

  // 3. Call Amazon Nova Lite via Converse API
  const response = await bedrockRuntimeClient.send(new ConverseCommand({
    modelId: env.BEDROCK_MODEL_ID,
    messages: [{
      role: 'user',
      content: [{ text: buildSummaryPrompt(transcriptText) }],
    }],
    inferenceConfig: {
      maxTokens: 4096,
      temperature: 0.3,
    },
  }));

  // 4. Extract summary text
  const summary = response.output?.message?.content?.[0]?.text ?? '';

  // 5. Cache in Mongo
  await Meeting.updateOne(
    { _id: meetingId, userId },
    { summary, transcript: segments }
  );

  return { summary, transcript: segments };
}
