'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

interface SocketEventHandlers {
  onVideoGenerationUpdate?: (data: any) => void
  onLayerUpdated?: (data: any) => void
  onTimelineUpdated?: (data: any) => void
  onCursorMoved?: (data: any) => void
  onChatMessageReceived?: (data: any) => void
  onUserJoined?: (data: any) => void
  onUserLeft?: (data: any) => void
  onProjectShared?: (data: any) => void
}

export function useSocket(projectId?: string, handlers?: SocketEventHandlers) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const handlersRef = useRef<SocketEventHandlers | undefined>(handlers)

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      toast.success('Connected to collaboration server')
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
      toast.error('Disconnected from server')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
      toast.error('Failed to connect to server')
    })

    // Join project room if projectId is provided
    if (projectId) {
      socketInstance.emit('join-project', projectId)
    }

    // Event handlers - use ref to avoid dependency issues
    const currentHandlers = handlersRef.current
    if (currentHandlers) {
      if (currentHandlers.onVideoGenerationUpdate) {
        socketInstance.on('video-generation-update', currentHandlers.onVideoGenerationUpdate)
      }

      if (currentHandlers.onLayerUpdated) {
        socketInstance.on('layer-updated', currentHandlers.onLayerUpdated)
      }

      if (currentHandlers.onTimelineUpdated) {
        socketInstance.on('timeline-updated', currentHandlers.onTimelineUpdated)
      }

      if (currentHandlers.onCursorMoved) {
        socketInstance.on('cursor-moved', currentHandlers.onCursorMoved)
      }

      if (currentHandlers.onChatMessageReceived) {
        socketInstance.on('chat-message-received', currentHandlers.onChatMessageReceived)
      }

      if (currentHandlers.onUserJoined) {
        socketInstance.on('user-joined', (data) => {
          setOnlineUsers(prev => [...prev, data.userId])
          currentHandlers.onUserJoined?.(data)
        })
      }

      if (currentHandlers.onUserLeft) {
        socketInstance.on('user-left', (data) => {
          setOnlineUsers(prev => prev.filter(id => id !== data.userId))
          currentHandlers.onUserLeft?.(data)
        })
      }

      if (currentHandlers.onProjectShared) {
        socketInstance.on('project-shared', currentHandlers.onProjectShared)
      }
    }

    // Cleanup
    return () => {
      if (projectId) {
        socketInstance.emit('leave-project', projectId)
      }
      socketInstance.disconnect()
    }
  }, [projectId]) // Remove handlers from dependency array

  // Socket action methods
  const socketActions = {
    joinProject: (projectId: string) => {
      socketRef.current?.emit('join-project', projectId)
    },

    leaveProject: (projectId: string) => {
      socketRef.current?.emit('leave-project', projectId)
    },

    updateVideoGenerationProgress: (data: {
      jobId: string
      projectId: string
      progress: number
      status: string
      message: string
    }) => {
      socketRef.current?.emit('video-generation-progress', data)
    },

    updateLayer: (data: {
      projectId: string
      layerId: string
      updates: any
      userId: string
    }) => {
      socketRef.current?.emit('layer-update', data)
    },

    updateTimeline: (data: {
      projectId: string
      timeline: any
      userId: string
    }) => {
      socketRef.current?.emit('timeline-update', data)
    },

    sendCursorPosition: (data: {
      projectId: string
      x: number
      y: number
      userId: string
    }) => {
      socketRef.current?.emit('cursor-move', data)
    },

    sendChatMessage: (data: {
      projectId: string
      message: string
      userId: string
      userName: string
    }) => {
      socketRef.current?.emit('chat-message', data)
    },

    shareProject: (data: {
      projectId: string
      shareUrl: string
      permissions: string[]
      userId: string
    }) => {
      socketRef.current?.emit('share-project', data)
    }
  }

  return {
    socket,
    isConnected,
    onlineUsers,
    ...socketActions
  }
}









