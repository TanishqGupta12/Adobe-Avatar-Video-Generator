import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AdobeAvatarAPI } from '@/lib/apis/adobe-avatar'

const AdobeAvatarSchema = z.object({
  inputType: z.enum(['text', 'textFile', 'audio']).default('text'),
  prompt: z.string().optional(),
  avatarId: z.string().min(1, 'Avatar ID is required'),
  voiceId: z.string().optional(),
  localeCode: z.string().default('en-US'),
  backgroundType: z.enum(['color', 'transparent', 'image', 'video']).optional(),
  backgroundColor: z.string().optional(),
  backgroundUrl: z.string().optional(),
  userId: z.string().optional(),
  // Text file input
  textFileUrl: z.string().optional(),
  // Audio input
  audioFileUrl: z.string().optional(),
  audioFormat: z.enum(['audio/wav', 'audio/mp3', 'audio/m4a']).optional(),
  // Output format
  outputFormat: z.enum(['video/mp4', 'video/webm']).default('video/mp4'),
}).refine((data) => {
  // Validate based on input type
  if (data.inputType === 'text') {
    return data.prompt && data.voiceId
  } else if (data.inputType === 'textFile') {
    return data.textFileUrl && data.voiceId
  } else if (data.inputType === 'audio') {
    return data.audioFileUrl
  }
  return false
}, {
  message: "Invalid input parameters for the specified input type"
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AdobeAvatarSchema.parse(body)

    const adobeAPI = new AdobeAvatarAPI({
      clientId: process.env.ADOBE_CLIENT_ID || 'PLACEHOLDER',
      clientSecret: process.env.ADOBE_CLIENT_SECRET || 'PLACEHOLDER'
    })

    // Check if we're in demo mode
    const isDemoMode = false // Using real Adobe credentials
    if (isDemoMode) {
      console.log('Running in demo mode - Adobe credentials not configured')
    }

    let result

    switch (validatedData.inputType) {
      case 'text':
        result = await adobeAPI.generateFromText({
          text: validatedData.prompt!,
          avatarId: validatedData.avatarId,
          voiceId: validatedData.voiceId!,
          localeCode: validatedData.localeCode,
          backgroundType: validatedData.backgroundType,
          backgroundColor: validatedData.backgroundColor,
          backgroundUrl: validatedData.backgroundUrl,
          outputFormat: validatedData.outputFormat
        })
        break

      case 'textFile':
        result = await adobeAPI.generateFromTextFile({
          textFileUrl: validatedData.textFileUrl!,
          avatarId: validatedData.avatarId,
          voiceId: validatedData.voiceId!,
          localeCode: validatedData.localeCode,
          backgroundType: validatedData.backgroundType,
          backgroundColor: validatedData.backgroundColor,
          backgroundUrl: validatedData.backgroundUrl,
          outputFormat: validatedData.outputFormat
        })
        break

      case 'audio':
        result = await adobeAPI.generateFromAudio({
          audioFileUrl: validatedData.audioFileUrl!,
          avatarId: validatedData.avatarId,
          audioFormat: validatedData.audioFormat,
          localeCode: validatedData.localeCode,
          backgroundType: validatedData.backgroundType,
          backgroundColor: validatedData.backgroundColor,
          backgroundUrl: validatedData.backgroundUrl,
          outputFormat: validatedData.outputFormat
        })
        break

      default:
        throw new Error('Invalid input type')
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        status: result.status,
        message: isDemoMode 
          ? 'Adobe Avatar API not accessible, using demo mode (credentials configured)'
          : 'Adobe Avatar video generation started successfully',
        demoMode: isDemoMode,
        hasCredentials: true
      }
    })

  } catch (error) {
    console.error('Adobe Avatar generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues || []
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const statusUrl = searchParams.get('statusUrl')

    if (!jobId && !statusUrl) {
      return NextResponse.json({
        success: false,
        error: 'Either Job ID or Status URL is required'
      }, { status: 400 })
    }

    const adobeAPI = new AdobeAvatarAPI({
      clientId: process.env.ADOBE_CLIENT_ID || 'PLACEHOLDER',
      clientSecret: process.env.ADOBE_CLIENT_SECRET || 'PLACEHOLDER'
    })

    let result
    if (statusUrl) {
      // Use the status URL directly (more reliable)
      result = await adobeAPI.getJobStatusByUrl(statusUrl)
    } else {
      // Use job ID to construct the status endpoint
      result = await adobeAPI.getJobStatus(jobId!)
    }
    
    const isDemoMode = false // Using real Adobe credentials

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        demoMode: isDemoMode,
        hasCredentials: true
      }
    })

  } catch (error) {
    console.error('Get Adobe Avatar job status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

