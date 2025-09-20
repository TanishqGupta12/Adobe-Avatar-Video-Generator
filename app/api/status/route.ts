import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        websocket: 'operational',
        videoGeneration: 'operational',
        collaboration: 'operational'
      },
      version: '1.0.0',
      uptime: process.uptime()
    }

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Service unavailable'
    }, { status: 503 })
  }
}







