'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Settings,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface RealTimeStreamProps {
  projectId: string
  userId: string
  userName: string
}

interface StreamData {
  id: string
  userId: string
  userName: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  timestamp: string
}

export default function RealTimeStream({ 
  projectId, 
  userId, 
  userName 
}: RealTimeStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [streamData, setStreamData] = useState<StreamData[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { 
    isConnected, 
    sendCursorPosition 
  } = useSocket(projectId, {
    onVideoGenerationUpdate: (data) => {
      console.log('Stream update:', data)
    }
  })

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected')
  }, [isConnected])

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setIsStreaming(true)
      
      // Simulate stream data updates
      const interval = setInterval(() => {
        setStreamData(prev => [...prev, {
          id: `stream_${Date.now()}`,
          userId,
          userName,
          isVideoEnabled,
          isAudioEnabled,
          timestamp: new Date().toISOString()
        }])
      }, 1000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error starting stream:', error)
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setStreamData([])
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
    }
  }

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Stream</h3>
        <div className="flex items-center gap-2">
          {getConnectionStatusIcon()}
          <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative mb-6">
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          {isStreaming ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No Stream Active</p>
                <p className="text-sm text-gray-400">Start streaming to see your video</p>
              </div>
            </div>
          )}
        </div>

        {/* Stream Controls Overlay */}
        {isStreaming && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">
                    {streamData.length} viewers
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {!isStreaming ? (
          <button
            onClick={startStream}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <Play className="w-5 h-5" />
            Start Stream
          </button>
        ) : (
          <>
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-lg transition-colors ${
                isVideoEnabled 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isVideoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg transition-colors ${
                isAudioEnabled 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </>
        )}
      </div>

      {/* Stream Stats */}
      {isStreaming && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Viewers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{streamData.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Status</span>
            </div>
            <div className="text-2xl font-bold text-green-600">Live</div>
          </div>
        </div>
      )}

      {/* Stream Quality Settings */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Stream Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quality</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>720p</option>
              <option>1080p</option>
              <option>4K</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bitrate</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>2 Mbps</option>
              <option>5 Mbps</option>
              <option>10 Mbps</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}









