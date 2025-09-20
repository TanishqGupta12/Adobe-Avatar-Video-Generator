'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Download, Loader2, Wand2 } from 'lucide-react'
import { useAdobeAvatar } from '@/hooks/useAdobeAvatar'
import { useSocket } from '@/hooks/useSocket'
import toast from 'react-hot-toast'

export default function UnifiedVideoGenerator() {
  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)

  const [inputType, setInputType] = useState<'text' | 'textFile' | 'audio'>('text')
  const [prompt, setPrompt] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [backgroundType, setBackgroundType] = useState<'color' | 'transparent' | 'image' | 'video'>('color')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [outputFormat, setOutputFormat] = useState<'video/mp4' | 'video/webm'>('video/mp4')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [textFile, setTextFile] = useState<File | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const [voicesState, setVoicesState] = useState<any[]>([])
  const [AvaterState, setAvaterState] = useState<any[]>([])


  
  const [projectId] = useState(`unified_${Date.now()}`)
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`)

  // Hooks
  const { 
    isGenerating: isAvatarGenerating, 
    currentJob: avatarCurrentJob, 
    avatars,
    voices,
    generateAvatarVideo, 
    pollJobStatus: pollAvatarJobStatus, 
    downloadVideo: downloadAvatarVideo,
    getAvatars,
    getVoices
  } = useAdobeAvatar()

  // Memoize the socket handlers to prevent infinite re-renders
  const socketHandlers = useMemo(() => ({
    onVideoGenerationUpdate: (data: any) => {
      console.log('Video generation update:', data)
    }
  }), [])

  const { updateVideoGenerationProgress } = useSocket(projectId, socketHandlers)

  // Load avatars and voices
    useEffect(() => {
      if (typeof window !== "undefined") {
        const avatarsStr = localStorage.getItem("adobeAvatars");
        if (avatarsStr) {
          try {
            const avatars = JSON.parse(avatarsStr);
            // console.log(avatars);
            
            if (Array.isArray(avatars)) {
              setAvaterState(avatars);
            } else {
            getAvatars().then((avatars) => {
              // console.log('Loaded avatars:', avatars)
            })
              
            }
          } catch {
            setAvaterState([]);
          }
        }

        const voicesStr = localStorage.getItem("adobeVoices");
        if (voicesStr) {
          try {
            const voices = JSON.parse(voicesStr);
            // console.log(voices);
            if (Array.isArray(voices)) {
              setVoicesState(voices);
            } else {
              getVoices().then((voices) => {
                // setSelectedVoice(voices)
              })
            }
          } catch {
            setVoicesState([]);
          }
        }
      }
    }, []);




  const hasUnsupportedCharacters = (text: string) => {
    const emojiRegex = /[\u2600-\u26FF]|[\u2700-\u27BF]|[\uD83C-\uD83D][\uDC00-\uDFFF]|[\uD83E][\uDD00-\uDDFF]/g
    return emojiRegex.test(text)
  }

  const handleGenerate = async () => {
    if (!selectedAvatar) return toast.error('Please select an avatar')
    if ((inputType === 'text' || inputType === 'textFile') && !selectedVoice) return toast.error('Please select a voice')
    if (inputType === 'text' && !prompt.trim()) return toast.error('Please enter a prompt')
    if (inputType === 'textFile' && !textFile) return toast.error('Please upload a text file')
    if (inputType === 'audio' && !audioFile) return toast.error('Please upload an audio file')

    if (inputType === 'text' && hasUnsupportedCharacters(prompt)) {
      toast('Text contains emojis or special characters. These will be automatically removed for Adobe API compatibility.', {
        icon: '⚠️',
        duration: 4000,
      })
    }

    try {
      setCurrentStep(2)
      setIsGenerating(true)

      const params: any = {
        inputType,
        avatarId: selectedAvatar,
        localeCode: 'en-US',
        backgroundType,
        backgroundColor,
        backgroundUrl,
        outputFormat,
        userId
      }

      if (inputType === 'text') {
        params.prompt = prompt
        params.voiceId = selectedVoice
      } else if (inputType === 'textFile') {
        params.voiceId = selectedVoice
        params.textFileUrl = 'https://example.com/uploaded-text-file.txt'
      } else if (inputType === 'audio') {
        params.audioFileUrl = 'https://example.com/uploaded-audio-file.wav'
        params.audioFormat = 'audio/wav'
      }

      const jobId = await generateAvatarVideo(params)

      if (jobId) {
        const isDemoJob = jobId.startsWith('demo_')
        setIsDemoMode(isDemoJob)
        if (isDemoJob) toast.success('Demo mode enabled.')

        pollAvatarJobStatus(jobId, (job) => {

          if (job.status === 'succeeded') {
            setCurrentStep(3)
            setIsGenerating(false)
            if (isDemoJob) toast.success('Demo video generated!')
          } else if (job.status === 'failed') {
            setCurrentStep(1)
            setIsGenerating(false)
            toast.error('Avatar video generation failed')
          }
        })
      }
    } catch (error) {
      setCurrentStep(1)
      setIsGenerating(false)
      console.error(error)
      toast.error('Failed to generate video')
    }
  }

  const getCurrentJob = () => avatarCurrentJob
  const getCurrentGenerating = () => isAvatarGenerating

  const handleDownload = () => {
    const job = getCurrentJob()
    if (!job || !job.output?.destination?.url) return
    downloadAvatarVideo(job.output.destination.url)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-4">Adobe Avatar Video Generator</h2>

        {isDemoMode && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-blue-800 text-sm font-medium">
              Using demo mode (API not accessible)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Left Panel */}
        <div className="space-y-6">

          {/* Avatar Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Avatar</h3>
            {AvaterState.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading avatars...</p>
              </div>
            ) : (
              <div className="overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '1300px'}}>
                <div className="grid grid-cols-2 gap-4">
                  {AvaterState.map((avatar) => (
                    <button
                      key={avatar.avatarId}
                      onClick={() => setSelectedAvatar(avatar.avatarId)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                        selectedAvatar === avatar.avatarId
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-100">
                        <img 
                          src={avatar.thumbnailUrls?.hd || avatar.thumbnailUrls?.lowRes}
                          alt={avatar.displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${avatar.displayName}&background=6366f1&color=fff&size=64`
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 block">{avatar.displayName}</span>
                      <p className="text-xs text-gray-500 mt-1 text-center leading-tight">
                        {avatar.ageGroup}, {avatar.gender === "M" ? "Male" : "Female"}  
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>


        </div>

        {/* Right Panel - Video Preview */}
        <div className="space-y-6">

          {/* Video Preview */}
          <div className="card p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Video Preview</h4>
            
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center relative overflow-hidden">
              {currentStep === 1 && (
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium">Enter your prompt to start</p>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <p className="text-lg font-medium">Generating...</p>
                  <p className="text-sm text-gray-300">Creating your video</p>
                </div>
              )}

              {currentStep === 3 && (() => {
                const job = getCurrentJob()
                const videoUrl = job?.output?.destination?.url
                return videoUrl && (
                  <div className="w-full h-full">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full rounded-xl"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={handleDownload}
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Text Input */}
          {inputType === 'text' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Script</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video..."
                className={`w-full h-32 p-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                  hasUnsupportedCharacters(prompt) ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}
              />
              {hasUnsupportedCharacters(prompt) && (
                <div className="mt-2 flex items-center text-yellow-700 text-sm">
                  <div className="w-4 h-4 mr-2">⚠️</div>
                  <span>Text contains emojis or special characters</span>
                </div>
              )}
            </div>
          )}

          {/* Voice Selection */}
          {(inputType === 'text' || inputType === 'textFile') && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Voice</h3>
              {voicesState.length === 0 ? (
                <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-500 text-sm">Loading voices...</p>
                </div>
              ) : (
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a voice</option>
                  {Array.isArray(voicesState) && voicesState.map((voice , index) => (
                    <option key={index} value={voice.voiceId}>
                      {voice.displayName} - {voice.style} - {voice.gender}
                    </option>
                  ))}
                </select>
              )}

              {selectedVoice && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  {(() => {
                    const voice = Array.isArray(voicesState) ? voicesState.find(v => v.voiceId === selectedVoice) : null
                    return voice ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Name:</strong> {voice.displayName}</p>
                        <p><strong>Style:</strong> {voice.style}</p>
                        <p><strong>Gender:</strong> {voice.gender}</p>
                        {voice.sampleURL && (
                          <div>
                            <strong>Sample:</strong>
                            <audio controls src={voice.sampleURL} className="mt-1 w-full"></audio>
                          </div>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Results Actions */}
          {currentStep === 3 && (
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setCurrentStep(1)
                    setInputType('text')
                    setPrompt('')
                    setSelectedAvatar('')
                    setSelectedVoice('')
                    setBackgroundType('color')
                    setBackgroundColor('#ffffff')
                    setBackgroundUrl('')
                    setOutputFormat('video/mp4')
                    setAudioFile(null)
                    setTextFile(null)
                    setIsDemoMode(false)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Create Another Video
                </button>
              </div>
            </div>
          )}

          {/* Background, Output Format, Generate Button */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Background</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Type</label>
                <select
                  value={backgroundType}
                  onChange={(e) => setBackgroundType(e.target.value as any)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="color">Color</option>
                  <option value="transparent">Transparent</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {backgroundType === 'color' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              )}

              {(backgroundType === 'image' || backgroundType === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background {backgroundType === 'image' ? 'Image' : 'Video'} URL
                  </label>
                  <input
                    type="url"
                    value={backgroundUrl}
                    onChange={(e) => setBackgroundUrl(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Enter ${backgroundType} URL`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Output Format */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Output Format</h3>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="video/mp4">MP4 (Recommended)</option>
              <option value="video/webm">WebM (Transparent backgrounds)</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="card p-6">
            <button
              onClick={handleGenerate}
              disabled={getCurrentGenerating() || !prompt.trim()}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {getCurrentGenerating() ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
