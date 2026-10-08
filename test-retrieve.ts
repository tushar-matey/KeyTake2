import mongoose from 'mongoose';
import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';

const uri = "mongodb://tusharmatey7017_db_user:6E13xYjcYqzpXOnj@ac-0uvjf9u-shard-00-00.8wnnfqs.mongodb.net:27017,ac-0uvjf9u-shard-00-01.8wnnfqs.mongodb.net:27017,ac-0uvjf9u-shard-00-02.8wnnfqs.mongodb.net:27017/keytaketwo?ssl=true&replicaSet=atlas-nkexr4-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const Meeting = mongoose.model('Meeting', new mongoose.Schema({}, { strict: false }));
  
  const latestMeeting = await Meeting.findOne().sort({ createdAt: -1 });
  console.log('Latest Meeting:', latestMeeting);
  
  if (!latestMeeting) return;
  
  const client = new BedrockAgentRuntimeClient({ region: 'ap-south-1' });
  const response = await client.send(new RetrieveCommand({
    knowledgeBaseId: '10OHJRT6VG',
    retrievalQuery: { text: 'what is The main objective' },
    retrievalConfiguration: {
      vectorSearchConfiguration: {
        numberOfResults: 6,
        filter: {
          andAll: [
            { equals: { key: 'userId', value: latestMeeting.userId } },
            { equals: { key: 'meetingId', value: latestMeeting._id.toString() } },
          ],
        },
      },
    },
  }));
  
  console.log('Retrieved results:');
  for (const r of response.retrievalResults || []) {
    console.log('---');
    console.log('Score:', r.score);
    console.log('Content:', r.content?.text?.substring(0, 200) + '...');
    console.log('Location:', JSON.stringify(r.location));
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
