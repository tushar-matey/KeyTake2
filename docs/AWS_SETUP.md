# AWS Setup Guide — KeyTake

This document is the manual guide for setting up the AWS infrastructure required for the KeyTake project. Because this project avoids heavy IaC tools to save time and complexity, you will configure these services via the AWS Management Console.

> **IMPORTANT:** Follow this guide step-by-step. Do not skip sections, especially the Cost Protection and IAM isolation steps.

---

## 1. Initial Setup and Region

1. Sign in to the AWS Management Console.
2. Choose **one region** and stick to it for all services (e.g., `us-east-1` or `us-west-2`).
3. Note your Region code (e.g., `us-east-1`). This will be your `AWS_REGION` env var.

## 2. Bedrock Model Access

1. Go to **Amazon Bedrock**.
2. In the left navigation pane, select **Model access**.
3. Click **Manage model access** (or "Enable specific models").
4. Request access to:
   - **Anthropic Claude 3.5 Sonnet** (or the latest Sonnet model you intend to use).
   - **Amazon Titan Text Embeddings V2**.
5. Wait for access to be granted (usually takes a few minutes).

## 3. S3 Buckets

We need two separate buckets.

### Bucket 1: Raw Uploads
1. Go to **S3** and create a bucket (e.g., `meeting-brain-raw-uploads`).
2. **Block Public Access**: Keep this ON.
3. **Bucket Versioning**: Disable.
4. **Default encryption**: Enable (SSE-S3).
5. **CORS configuration** (Permissions tab):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
       "AllowedOrigins": ["http://localhost:5173", "https://your-vercel-domain.vercel.app"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
6. **Lifecycle Rule** (Management tab):
   - Name: `AbortIncompleteMultipartUploads`
   - Action: Check "Delete incomplete multipart uploads"
   - Number of days: `1`

### Bucket 2: Derived Output
1. Create another bucket (e.g., `meeting-brain-derived-output`).
2. **Block Public Access**: Keep this ON.
3. No CORS or Lifecycle rules required for this bucket.

## 4. Amazon Cognito

1. Go to **Cognito** and click **Create user pool**.
2. **Step 1:** Sign-in options: Select **Email**.
3. **Step 2:** Security: Choose Cognito defaults. Keep MFA optional or disabled based on preference. Enable self-service account recovery (Email only).
4. **Step 3:** Sign-up experience: Keep default attributes.
5. **Step 4:** Message delivery: Choose "Send email with Cognito" (for development/low volume).
6. **Step 5:** App integration:
   - App type: **Public client** (Single Page App).
   - App client name: `meeting-brain-client`.
   - **Client secret**: Do NOT generate a client secret.
7. **Step 6:** Review and Create.
8. Note the **User Pool ID** and **App Client ID**.

## 5. Amazon S3 Vectors (for Knowledge Base)

Instead of using OpenSearch, we use S3 Vectors to minimize costs.
_Note: Configure this during the Knowledge Base creation step (Section 7), where you can select "Amazon S3 Vectors" as the vector store._

## 6. Bedrock Data Automation (BDA)

1. Go to **Amazon Bedrock**.
2. In the left navigation, under **Data Automation**, select **Projects**.
3. Create a new BDA project.
4. Name: `MeetingBrainAudioTranscription`.
5. Under configuration, ensure **Speaker Diarization** is **ENABLED**.
6. Set the output destination to the **Derived Output Bucket** (`s3://meeting-brain-derived-output/bda-output/`).
7. Note the **Project ARN**.

## 7. Bedrock Knowledge Base

1. Go to **Amazon Bedrock** > **Knowledge bases** > **Create knowledge base**.
2. Name: `MeetingBrainKB`.
3. **IAM Role**: Create and use a new service role.
4. **Data Source 1 (Data Source A - Audio/PDFs):**
   - Name: `DataSourceA_BDA`.
   - Source: S3 URI pointing to `s3://meeting-brain-raw-uploads/` (or a specific prefix if preferred).
   - Chunking strategy: Default or Hierarchical (choose based on preference, Default is fine).
   - Parsing model: Select **Bedrock Data Automation (BDA)** and provide your BDA Project ARN.
   - Note: We will handle the inclusion/exclusion filters later via the API or console to ensure this only picks up Audio and PDF.
5. **Data Source 2 (Data Source B - Documents):**
   - Create another data source for the same KB.
   - Name: `DataSourceB_Docs`.
   - Source: S3 URI pointing to `s3://meeting-brain-raw-uploads/`.
   - Parsing model: Default.
6. **Embeddings Model**: Select **Titan Text Embeddings V2**.
7. **Vector Store**: Select **Amazon S3**. Choose a prefix in your derived bucket for vector storage (e.g., `s3://meeting-brain-derived-output/vectors/`).
   - _Note on Metadata:_ Ensure Bedrock's text and metadata fields are configured as non-filterable if possible, as S3 Vectors has limitations on metadata size.
8. Complete creation. Note the **Knowledge Base ID**, **Data Source A ID**, and **Data Source B ID**.

## 8. IAM Users and Roles

### Lambda Execution Role
1. Go to **IAM** > **Roles** > **Create role**.
2. Trusted entity: **AWS service** -> **Lambda**.
3. Attach policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs).
   - Create an inline policy allowing:
     - `s3:GetObject` on `meeting-brain-raw-uploads` bucket.
     - `bedrock:StartIngestionJob` on the Knowledge Base.
4. Note the Role ARN.

### Render / Server IAM User
1. Go to **IAM** > **Users** > **Create user**.
2. Name: `meeting-brain-server`.
3. **Do not provide console access.**
4. Create an inline policy with least privilege:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::meeting-brain-raw-uploads",
           "arn:aws:s3:::meeting-brain-raw-uploads/*",
           "arn:aws:s3:::meeting-brain-derived-output",
           "arn:aws:s3:::meeting-brain-derived-output/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:Retrieve",
           "bedrock:InvokeModel",
           "bedrock:Converse"
         ],
         "Resource": "*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "cognito-idp:AdminDeleteUser"
         ],
         "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID"
       }
     ]
   }
   ```
5. Generate an **Access Key** for this user. Save the Key ID and Secret Key securely.

## 9. Ingestion Lambda Deployment

1. Once the Lambda code is built (`npm run build` in the `lambda` folder), create a zip file containing `dist/` and `node_modules/`.
2. Go to **Lambda** > **Create function**.
3. Name: `MeetingBrainIngestion`.
4. Runtime: Node.js 20.x.
5. Execution role: Select the Lambda Execution Role created in Section 8.
6. **Environment Variables**:
   - `S3_RAW_BUCKET`
   - `BEDROCK_KB_ID`
   - `BEDROCK_DS_A_ID`
   - `BEDROCK_DS_B_ID`
   - `AWS_REGION`
   - `MONGODB_URI`
7. **Configuration** > **General configuration**:
   - Memory: `256 MB`
   - Timeout: `60 seconds`
8. **Concurrency**: Set Reserved Concurrency to `2` to prevent spikes and runaway costs.
9. **Upload** the zip file.

### Configure S3 Event Trigger (CRITICAL)
1. Go to the `meeting-brain-raw-uploads` bucket > **Properties** > **Event notifications**.
2. Create event notification:
   - Name: `LambdaIngestAudio`
   - Event types: `All object create events`
   - Prefix: `users/`
   - Suffix: `.mp3`
   - Destination: Lambda function -> `MeetingBrainIngestion`
3. **Repeat** step 2 for EACH supported suffix (`.wav`, `.flac`, `.m4a`, `.ogg`, `.amr`, `.pdf`, `.docx`, `.txt`, `.md`).
   - *AWS requires separate event notification rules if you need multiple suffixes on the same prefix.*
4. **WARNING:** NEVER add a trigger for `.metadata.json` or no suffix at all. This will cause infinite recursive loops.

## 10. EventBridge (Optional but Recommended for Status Updates)

If you want the backend to be notified when an ingestion job finishes instead of polling from the Lambda (which costs money):
1. Go to **EventBridge** > **Rules** > **Create rule**.
2. Event pattern:
   ```json
   {
     "source": ["aws.bedrock"],
     "detail-type": ["Knowledge Base Ingestion Job State Change"],
     "detail": {
       "knowledgeBaseId": ["YOUR_KB_ID"]
     }
   }
   ```
3. Set the target to another small Lambda function or an API Gateway webhook hitting your Express server to update the meeting status in MongoDB.
*(For simplicity, Phase 4 might use a basic check or assume completion after a set time, but EventBridge is the robust way).*

## 11. Cost Protection & Hardening

1. **CloudWatch Log Retention**: Go to CloudWatch > Log groups. Find the log groups for your Lambda functions and change the retention from "Never expire" to **7 days** or **14 days**.
2. **Billing Alarms**: Go to Billing > Budgets. Set a daily or monthly budget alarm (e.g., $10/month) that emails you if costs spike.

## 12. Deployment

### Render (Express Server)
1. Create a new Web Service.
2. Connect your repository.
3. Root directory: `.` (or empty).
4. Build Command: `npm install && npm run build:shared && npm run build -w server`
5. Start Command: `node server/dist/server.js`
6. Add ALL environment variables from `server/.env.example`.
   - Use the Access Key ID and Secret Key from the Render IAM User (Section 8).

### Vercel (React Client)
1. Import your repository in Vercel.
2. Framework Preset: Vite.
3. Root Directory: `client`
4. Build Command: `npm run build`
5. Add environment variables:
   - `VITE_API_URL` (URL of your Render backend)
   - `VITE_COGNITO_USER_POOL_ID`
   - `VITE_COGNITO_CLIENT_ID`
   - `VITE_COGNITO_REGION`

## 13. End-to-End Verification

1. Go to your Vercel app URL.
2. Sign up for a new account. Check your email for the confirmation code.
3. Sign in.
4. Upload a small `.mp3` file.
5. Verify in the AWS console:
   - The `.mp3` is in the raw bucket.
   - The `.metadata.json` sidecar is next to it.
   - The Lambda fired exactly once (check CloudWatch).
   - The Knowledge Base ingestion job started.
6. Wait for the meeting to show as `ready` in the UI.
7. Click the meeting, view the summary and transcript.
8. Ask a question in the chat and verify the response includes citations.
9. Try deleting the meeting and verifying the files are removed from S3.
