import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Load tags data
    const tagsFilePath = join(process.cwd(), 'yue_tags_json.json')
    const tagsData = JSON.parse(readFileSync(tagsFilePath, 'utf8'))
    const { genres, instruments, moods, gender, timbre } = tagsData.yue_tags

    const systemPrompt = `You are a music tag extraction expert. Given a natural language prompt about music, extract exactly 6 tags total representing the music's characteristics.

Available tags:
GENRES: ${genres.join(', ')}
INSTRUMENTS: ${instruments.join(', ')}
MOODS: ${moods.join(', ')}
GENDER: ${gender.join(', ')}
TIMBRE: ${timbre.join(', ')}

Rules:
1. Extract exactly 6 tags total from ALL categories combined
2. Choose the most relevant tags that best represent the user's request
3. Ensure you cover different aspects: genre, instrument, mood, gender (if vocals), timbre (if vocals)
4. Return ONLY the 6 tags as a comma-separated string
5. Use exact tag names from the lists above
6. If no gender/timbre is specified but vocals are implied, choose appropriate defaults

Example:
Input: "Create an upbeat electronic dance track with female vocals"
Output: electronic, dance, uplifting, synthesizer, female, bright vocal`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    })

    const extractedTags = completion.choices[0].message.content?.trim()

    if (!extractedTags) {
      return NextResponse.json({ error: 'Failed to extract tags' }, { status: 500 })
    }

    // Validate that we got exactly 6 tags
    const tags = extractedTags.split(',').map(tag => tag.trim())
    
    if (tags.length !== 6) {
      return NextResponse.json({ 
        error: `Expected 6 tags, got ${tags.length}`, 
        tags: extractedTags 
      }, { status: 400 })
    }

    return NextResponse.json({
      prompt,
      tags: extractedTags,
      extractedTags: tags
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to extract tags',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
