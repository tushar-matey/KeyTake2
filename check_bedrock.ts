import { BedrockAgentClient, ListIngestionJobsCommand, ListDataSourcesCommand } from '@aws-sdk/client-bedrock-agent';

const client = new BedrockAgentClient({ region: 'ap-south-1' });

async function run() {
  const kbId = '10OHJRT6VG';
  
  const dsResponse = await client.send(new ListDataSourcesCommand({
    knowledgeBaseId: kbId,
    maxResults: 10
  }));
  
  console.log('Data Sources:', dsResponse.dataSourceSummaries);
  
  for (const ds of dsResponse.dataSourceSummaries || []) {
    const jobs = await client.send(new ListIngestionJobsCommand({
      knowledgeBaseId: kbId,
      dataSourceId: ds.dataSourceId,
      maxResults: 3,
      sortBy: { attribute: 'STARTED_AT', order: 'DESCENDING' }
    }));
    console.log(`Jobs for DS ${ds.dataSourceId} (${ds.name}):`, jobs.ingestionJobSummaries);
  }
}

run().catch(console.error);
