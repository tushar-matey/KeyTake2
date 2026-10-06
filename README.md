# keytake

A meeting intelligence application built with AWS Bedrock, Claude, and Strands Agents.

## Setup

1. Run `npm install` at the root.
2. Build the shared workspace: `npm run build:shared`.
3. Set up environment variables by copying `.env.example` to `.env` in `server/`, `client/`, and `lambda/`.
4. Run development servers: `npm run dev:server` and `npm run dev:client`.

## Cost Estimates

| Component | Estimated Cost | Notes |
|---|---|---|
| BDA audio processing | ~$0.012/minute | Main cost driver |
| Claude Sonnet (summary) | ~$0.003/1K input + $0.015/1K output tokens | One call per meeting |
| Claude Sonnet (chat) | Same as above | Per chat message |
| Titan Embeddings V2 | ~$0.00002/1K tokens | At ingestion time |
| S3 storage | ~$0.023/GB/month | Minimal for small usage |
| S3 Vectors | See AWS pricing page | VERIFY IN CONSOLE |
| Lambda | 1M free requests/month | Stay within free tier |
| Cognito | 10K free MAU | Stay within free tier |
