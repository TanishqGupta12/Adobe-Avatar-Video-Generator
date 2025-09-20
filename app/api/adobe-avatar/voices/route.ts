import { NextRequest, NextResponse } from 'next/server'
import { AdobeAvatarAPI } from '@/lib/apis/adobe-avatar'

export async function GET(request: NextRequest) {
  try {
    const adobeAPI = new AdobeAvatarAPI({
      clientId: process.env.ADOBE_CLIENT_ID,
      clientSecret: process.env.ADOBE_CLIENT_SECRET,
    })

    const voices = await adobeAPI.getVoices()

    // Normalize voices to always be an array
    const voicesArray = Array.isArray(voices) ? voices : Array.isArray((voices as any)?.voices) ? (voices as any).voices : []

    // console.log('Voices API response (first 10):', voicesArray.slice(0, 2))

    return NextResponse.json({
      success: true,
      data: voicesArray
    })

  } catch (error) {
    console.error('Get voices error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
