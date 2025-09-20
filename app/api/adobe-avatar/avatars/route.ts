import { NextRequest, NextResponse } from 'next/server'
import { AdobeAvatarAPI } from '@/lib/apis/adobe-avatar'

export async function GET(request: NextRequest) {
  try {
    const adobeAPI = new AdobeAvatarAPI({
      clientId: process.env.ADOBE_CLIENT_ID,
      clientSecret: process.env.ADOBE_CLIENT_SECRET,
    })

    const avatars = await adobeAPI.getAvatars()

    // Normalize response to always be an array
    const avatarsArray = Array.isArray(avatars)
      ? avatars
      : Array.isArray((avatars as any)?.avatars)
        ? (avatars as any).avatars
        : []


        // console.log('Voices API response (first 10):', avatarsArray.slice(0, 2))console.log('Fetched voices:', voices)

    return NextResponse.json({
      success: true,
      data: avatarsArray,
    })
  } catch (error) {
    console.error('Get avatars error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
