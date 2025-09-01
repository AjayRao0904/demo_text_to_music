import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadAudioToS3(audioUrl: string, fileName: string): Promise<string> {
  try {
    // Download the audio file from Replicate
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioUint8Array = new Uint8Array(audioBuffer)

    // Generate S3 key with timestamp
    const timestamp = Date.now()
    const s3Key = `music-generations/${timestamp}-${fileName}.wav`

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      Body: audioUint8Array,
      ContentType: 'audio/wav',
      ContentDisposition: 'inline',
    })

    await s3Client.send(uploadCommand)

    // Return the S3 URL
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
    
    return s3Url

  } catch (error) {
    throw new Error(`Failed to upload audio to S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
