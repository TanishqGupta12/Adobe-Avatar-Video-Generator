'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageCircle, 
  Send, 
  Video, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Share2,
  Settings,
  Crown,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface CollaborationPanelProps {
  projectId: string
  userId: string
  userName: string
}

interface ChatMessage {
  id: string
  message: string
  userId: string
  userName: string
  timestamp: string
}

interface OnlineUser {
  id: string
  name: string
  avatar?: string
  isActive: boolean
  lastSeen: string
}

export default function CollaborationPanel({ 
  projectId, 
  userId, 
  userName 
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'users' | 'video'>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { 
    isConnected, 
    onlineUsers: socketUsers,
    sendChatMessage,
    shareProject
  } = useSocket(projectId, {
    onChatMessageReceived: (data: ChatMessage) => {
      setChatMessages(prev => [...prev, data])
    },
    onUserJoined: (data) => {
      setOnlineUsers(prev => [...prev, {
        id: data.userId,
        name: `User ${data.userId.slice(-4)}`,
        isActive: true,
        lastSeen: data.timestamp
      }])
    },
    onUserLeft: (data) => {
      setOnlineUsers(prev => prev.filter(user => user.id !== data.userId))
    }
  })

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      sendChatMessage({
        projectId,
        message: newMessage.trim(),
        userId,
        userName
      })
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleShareProject = () => {
    const shareUrl = `${window.location.origin}/studio/${projectId}`
    shareProject({
      projectId,
      shareUrl,
      permissions: ['view', 'edit'],
      userId
    })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Collaboration</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 mx-auto mb-1" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 mx-auto mb-1" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'video'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-4 h-4 mx-auto mb-1" />
            Video
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start a conversation with your team</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.userId === userId
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.userId !== userId && (
                          <div className="text-xs font-medium mb-1 opacity-75">
                            {message.userName}
                          </div>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <div className="text-xs opacity-75 mt-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full p-4"
            >
              <div className="space-y-3">
                {onlineUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No users online</p>
                  </div>
                ) : (
                  onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          user.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {user.name}
                          </span>
                          {user.id === userId && (
                            <Crown className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.isActive ? 'Active now' : `Last seen ${formatTime(user.lastSeen)}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Share Project Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleShareProject}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Project
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'video' && (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full p-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Video Call</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Start a video call with your team members
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setIsVideoCallActive(!isVideoCallActive)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isVideoCallActive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {isVideoCallActive ? (
                      <>
                        <PhoneOff className="w-4 h-4" />
                        End Call
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        Start Call
                      </>
                    )}
                  </button>
                  
                  {isVideoCallActive && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        isMuted
                          ? 'bg-gray-500 text-white hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {isMuted ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Mute
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}









