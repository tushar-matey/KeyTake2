# KeyTake

![KeyTake Banner](https://img.shields.io/badge/Status-Active-success)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazon-aws&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)

**KeyTake** is a full-stack, AI-powered meeting intelligence platform designed to transcribe, summarize, and let you "chat" with your meetings. Built with a modern TypeScript monorepo, KeyTake leverages cutting-edge AWS Bedrock generative AI models and serverless event-driven architecture to process audio seamlessly.

## Key Features

- **Direct-to-Cloud Uploads**: Secure, multipart presigned URL uploads directly from the browser to Amazon S3.
- **Automated Transcription**: Event-driven AWS Lambda triggers Amazon Bedrock Data Automation (BDA) to generate highly accurate, speaker-diarized transcripts.
- **Intelligent Summarization**: Automatically generates structured meeting summaries using **Amazon Nova Lite**.
- **Agentic RAG Chat**: Chat with your meeting! Powered by **Strands Agents** and Amazon Nova Lite, the assistant uses a custom retrieval tool to query your meeting's vector embeddings and streams the response back via Server-Sent Events (SSE).
- **Secure Authentication**: End-to-end user management via AWS Cognito.

## AWS Services Used

This project heavily leverages the AWS ecosystem to build a scalable and cost-effective AI platform:

- **Amazon Bedrock**: The core generative AI service used to access foundation models.
- **Amazon Bedrock Data Automation (BDA)**: Used to transcribe uploaded audio files and perform speaker diarization.
- **Amazon Bedrock Knowledge Bases**: Managed RAG (Retrieval-Augmented Generation) system used to securely search and retrieve meeting context during chat.
- **Amazon Nova Lite**: The primary foundation model used for both structured summarization and conversational AI (via the Converse API).
- **Amazon Titan Text Embeddings V2**: The embedding model used to vectorize transcripts for the Knowledge Base.
- **AWS Lambda**: Serverless compute used for event-driven processing (triggered automatically when a user uploads a new meeting recording).
- **Amazon S3**: Scalable object storage used for storing raw audio files and derived JSON transcripts.
- **Amazon S3 Vectors**: The underlying vector database used by the Bedrock Knowledge Base to store embeddings.
- **Amazon Cognito**: Fully managed identity provider used for user registration, authentication, and secure access management.

---

## Architecture & Tech Stack

This project is built using a modern **TypeScript Monorepo** (`npm workspaces`), consisting of three core packages: `client`, `server`, and `shared`.

### Frontend (`/client`)
- **Framework**: React 18, Vite, React Router DOM
- **Styling**: Tailwind CSS, Lucide Icons, Shadcn-style UI components
- **State & Data Fetching**: Tanstack Query (React Query)
- **Features**: Real-time status polling, SSE streaming for chat, responsive design.

### Backend (`/server`)
- **Runtime**: Node.js, Express.js
- **Database**: MongoDB (Mongoose) for metadata and state management.
- **AWS Integration**: AWS SDK v3 (S3, Bedrock, Bedrock Agent Runtime)
- **Security**: Helmet, CORS, Rate Limiting, JWT validation.

### Generative AI & Data Pipeline
The data pipeline is fully automated and event-driven:

1. **Ingestion**: User uploads audio -> React requests Presigned URL -> Uploads to **S3 Raw Bucket**.
2. **Event Trigger**: S3 `ObjectCreated` event triggers an **AWS Lambda** function.
3. **Processing**: Lambda invokes **Amazon Bedrock Data Automation (BDA)** to transcribe the audio and deposits the result into an **S3 Derived Bucket**.
4. **Vectorization**: The transcript is automatically ingested into an **Amazon Bedrock Knowledge Base** (backed by an S3 Vector store) using **Amazon Titan Text Embeddings V2**.
5. **Summarization**: The backend fetches the transcript and prompts **Amazon Nova Lite** (via the Bedrock Converse API) to generate a summary.
6. **Agentic Chat**: A **Strands Agent** is instantiated for chat. It uses a custom `Retrieve` tool to query the Knowledge Base and streams context-aware answers back to the user.

---

## Setup & Installation

### Prerequisites
- Node.js (v20+)
- MongoDB instance (e.g., MongoDB Atlas)
- AWS Account with Bedrock model access enabled (Amazon Nova Lite, Titan Embeddings V2, Bedrock Data Automation).

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Shared Workspace
The `shared` workspace contains the Zod schemas and TypeScript interfaces used by both the client and server.
```bash
npm run build:shared
```

### 3. Environment Variables
Copy the `.env.example` files in each workspace and fill in your AWS/MongoDB credentials.
- `server/.env`
- `client/.env`
- `lambda/.env`

### 4. Run Locally
Start both the client and server concurrently:
```bash
npm run dev
```
*(This uses the root package.json to spin up the Vite dev server and the Express nodemon server).*

---

## Cost Estimates

This application is optimized for cost-efficiency by leveraging serverless and usage-based pricing:

| Component | Estimated Cost | Notes |
|---|---|---|
| **BDA Audio Processing** | ~$0.012 / minute | Main cost driver for audio processing |
| **Amazon Nova Lite (Summary)** | Fraction of a cent | One call per meeting (Converse API) |
| **Amazon Nova Lite (Chat)** | Fraction of a cent | Per chat message |
| **Titan Embeddings V2** | ~$0.00002 / 1K tokens | At ingestion time |
| **S3 Storage** | ~$0.023 / GB / month | Minimal for small usage |
| **AWS Lambda** | Free Tier (1M reqs) | Extremely cheap |
| **AWS Cognito** | Free Tier (50K MAU) | Free for most side projects |

---

## Author

Built as a showcase for full-stack AI engineering, event-driven pipelines, and modern TypeScript architectures. Open to work and exciting opportunities!
