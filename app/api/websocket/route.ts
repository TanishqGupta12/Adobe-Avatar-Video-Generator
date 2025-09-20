import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'
import { Socket as NetSocket } from 'net'

interface SocketServer extends NetServer {
  io?: SocketIOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends Response {
  socket: SocketWithIO
}

// Global socket server instance
let io: SocketIOServer | null = null

export async function GET(request: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = new NetServer()
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? 'https://yourdomain.com' 
          : 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    })

    // Handle connections
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Join project room
      socket.on('join-project', (projectId: string) => {
        socket.join(`project-${projectId}`)
        console.log(`User ${socket.id} joined project ${projectId}`)
        
        // Notify others in the project
        socket.to(`project-${projectId}`).emit('user-joined', {
          userId: socket.id,
          timestamp: new Date().toISOString()
        })
      })

      // Leave project room
      socket.on('leave-project', (projectId: string) => {
        socket.leave(`project-${projectId}`)
        console.log(`User ${socket.id} left project ${projectId}`)
        
        // Notify others in the project
        socket.to(`project-${projectId}`).emit('user-left', {
          userId: socket.id,
          timestamp: new Date().toISOString()
        })
      })

      // Handle real-time video generation updates
      socket.on('video-generation-progress', (data: {
        jobId: string
        projectId: string
        progress: number
        status: string
        message: string
      }) => {
        socket.to(`project-${data.projectId}`).emit('video-generation-update', data)
      })

      // Handle collaborative editing
      socket.on('layer-update', (data: {
        projectId: string
        layerId: string
        updates: any
        userId: string
      }) => {
        socket.to(`project-${data.projectId}`).emit('layer-updated', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Handle timeline changes
      socket.on('timeline-update', (data: {
        projectId: string
        timeline: any
        userId: string
      }) => {
        socket.to(`project-${data.projectId}`).emit('timeline-updated', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Handle cursor position for collaboration
      socket.on('cursor-move', (data: {
        projectId: string
        x: number
        y: number
        userId: string
      }) => {
        socket.to(`project-${data.projectId}`).emit('cursor-moved', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Handle chat messages
      socket.on('chat-message', (data: {
        projectId: string
        message: string
        userId: string
        userName: string
      }) => {
        const messageData = {
          ...data,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        }
        
        io?.to(`project-${data.projectId}`).emit('chat-message-received', messageData)
      })

      // Handle project sharing
      socket.on('share-project', (data: {
        projectId: string
        shareUrl: string
        permissions: string[]
        userId: string
      }) => {
        socket.to(`project-${data.projectId}`).emit('project-shared', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
      })
    })
  }

  return new Response('WebSocket server initialized', { status: 200 })
}

// Note: Socket.IO server is initialized in GET handler
// For production use, consider using a separate server or Next.js API routes




