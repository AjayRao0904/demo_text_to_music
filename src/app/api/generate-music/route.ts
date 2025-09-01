import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Replicate from 'replicate'
import { getGenerationsCollection, ObjectId } from '@/lib/mongodb'
import { checkRateLimit, generateSecureId, hashUrl, createSecureAudioUrl } from '@/lib/security'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

// S3 Client setup
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

async function uploadAudioToS3(audioUrl: string, generationId: string): Promise<string> {
  try {
    // Download the audio file from the URL
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }
    
    const audioBuffer = await response.arrayBuffer()
    const fileName = `music-generations/${Date.now()}-${generationId}.wav`
    
    // Upload to S3 (just for storage, no public access)
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(audioBuffer),
      ContentType: 'audio/wav'
      // Removed ACL since bucket doesn't support it
    })
    
    await s3Client.send(uploadCommand)
    
    // Return the S3 URL
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
  } catch (error) {
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`music_${clientIp}`, 5, 300000)) { // 5 requests per 5 minutes
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait before generating more music.' }, { status: 429 })
    }

    const { prompt, lyrics } = await request.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate secure ID for this generation
    const generationId = generateSecureId()

    // Load the tags JSON file to extract relevant tags
    const tagsJsonPath = 'c:\\Users\\ajayr\\Desktop\\texttomusic\\DemoUI\\yue_tags_json.json'
    const tagsData = JSON.parse(fs.readFileSync(tagsJsonPath, 'utf8'))

    // Use OpenAI to extract relevant tags from the prompt
    const tagCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a music tag extractor. Given a user prompt about music they want to generate, extract exactly 6 relevant tags from the provided JSON data that best match the musical style, mood, and characteristics described in the prompt. Return only the tags as a comma-separated string, nothing else.

Available tags JSON: ${JSON.stringify(tagsData)}`
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    })

    const tags = tagCompletion.choices[0]?.message?.content?.trim() || ''

    // Format lyrics for Replicate model
    let formattedLyrics = ''
    if (lyrics) {
      // For vocal tracks, wrap user-provided lyrics in [verse] tags
      formattedLyrics = `[verse]${lyrics}[verse]`
    } else {
      // For instrumental tracks
      formattedLyrics = '[inst]'
    }
    
    // Generate music using Replicate
    const output = await replicate.run(
      "lucataco/ace-step:280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1",
      {
        input: {
          tags: tags, // Use "tags" instead of "prompt" 
          lyrics: formattedLyrics,
          duration: 20
        }
      }
    )

    // Extract URL from Replicate response
    const replicateUrl = String(output)

    // Upload to S3 for permanent storage
    const s3Url = await uploadAudioToS3(replicateUrl, generationId)

    // Create secure URL hash for the Replicate URL (for user access)
    const urlHash = hashUrl(replicateUrl, generationId)
    const secureAudioUrl = createSecureAudioUrl(generationId, urlHash)

    // Save to database with both URLs (optional - system works without it)
    try {
      const generationsCollection = await getGenerationsCollection()
      const generation = {
        _id: new ObjectId(),
        generationId: generationId,
        prompt: prompt,
        tags,
        lyrics: lyrics || null,
        audioUrl: s3Url,
        replicateUrl: replicateUrl,
        status: "COMPLETED",
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await generationsCollection.insertOne(generation)
    } catch (dbError) {
      // Database save failed but system continues without DB
      // System works fine without database - just for record keeping
    }

    // Return response with direct Replicate URL for immediate access
    return NextResponse.json({
      success: true,
      generationId,
      audioUrl: replicateUrl, // Direct Replicate URL for immediate playback
      message: 'Music generated successfully!'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate music. Please try again.' },
      { status: 500 }
    )
  }
}
