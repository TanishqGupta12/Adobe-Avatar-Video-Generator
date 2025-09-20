'use client'

import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Download, 
  Loader2,
  Wand2
} from 'lucide-react'
import { useAdobeAvatar } from '@/hooks/useAdobeAvatar'
import { useSocket } from '@/hooks/useSocket'
import toast from 'react-hot-toast'

export default function UnifiedVideoGenerator() {
  // State Management
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Video Generation State
  const [inputType, setInputType] = useState<'text' | 'textFile' | 'audio'>('text')
  const [prompt, setPrompt] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedVoice, setSelectedVoice] = useState()
  const [backgroundType, setBackgroundType] = useState<'color' | 'transparent' | 'image' | 'video'>('color')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [outputFormat, setOutputFormat] = useState<'video/mp4' | 'video/webm'>('video/mp4')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [textFile, setTextFile] = useState<File | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  // Data State
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

  const { 
    isConnected, 
    updateVideoGenerationProgress 
  } = useSocket(projectId, {
    onVideoGenerationUpdate: (data) => {
      console.log('Video generation update:', data)
    }
  })

  // Load avatars and voices on component mount
  useEffect(() => {
    console.log('Loading avatars and voices...')
    getAvatars().then((avatars) => {
      
      // console.log('Loaded avatars:', avatars)
    })
    getVoices().then((voices) => {
      setSelectedVoice(voices)
    })
  }, [getAvatars, getVoices])

  // Check for unsupported characters
  const hasUnsupportedCharacters = (text: string) => {
    // Check for emojis and special symbols - using ES5 compatible syntax
    const emojiRegex = /[\u2600-\u26FF]|[\u2700-\u27BF]|[\uD83C-\uD83D][\uDC00-\uDFFF]|[\uD83E][\uDD00-\uDDFF]/g
    return emojiRegex.test(text)
  }

  // Generation Handler
  const handleGenerate = async () => {
    if (!selectedAvatar) {
      toast.error('Please select an avatar')
      return
    }

    // Validate based on input type
    if (inputType === 'text' && !prompt.trim()) {
      toast.error('Please enter a prompt for your video')
      return
    }

    // Check for unsupported characters in text input
    if (inputType === 'text' && hasUnsupportedCharacters(prompt)) {
      toast('Text contains emojis or special characters. These will be automatically removed for Adobe API compatibility.', {
        icon: '⚠️',
        duration: 4000,
      })
    }

    if ((inputType === 'text' || inputType === 'textFile') && !selectedVoice) {
      toast.error('Please select a voice')
      return
    }

    if (inputType === 'textFile' && !textFile) {
      toast.error('Please upload a text file')
      return
    }

    if (inputType === 'audio' && !audioFile) {
      toast.error('Please upload an audio file')
      return
    }

    try {
      setCurrentStep(2)
      setIsGenerating(true)
      
      // Prepare parameters based on input type
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
        // In a real implementation, you'd upload the file and get a URL
        params.textFileUrl = 'https://example.com/uploaded-text-file.txt'
      } else if (inputType === 'audio') {
        // In a real implementation, you'd upload the file and get a URL
        params.audioFileUrl = 'https://example.com/uploaded-audio-file.wav'
        params.audioFormat = 'audio/wav'
      }
      
      // Use Adobe Avatar generation
      const jobId = await generateAvatarVideo(params)

      if (jobId) {
        // Check if this is a demo job
        const isDemoJob = jobId.startsWith('demo_')
        setIsDemoMode(isDemoJob)
        
        if (isDemoJob) {
          toast.success('Adobe Avatar API not accessible - Using demo mode (credentials configured)')
        }

        pollAvatarJobStatus(jobId, (job) => {
          updateVideoGenerationProgress({
            jobId,
            projectId,
            progress: job.status === 'succeeded' ? 100 : 50,
            status: job.status,
            message: isDemoJob ? `Generating demo video...` : `Generating avatar video...`
          })

          if (job.status === 'succeeded') {
            setCurrentStep(3)
            setIsGenerating(false)
            if (isDemoJob) {
              toast.success('Demo video generated successfully!')
            }
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
      console.error('Generation error:', error)
      toast.error('Failed to generate video')
    }
  }

  const getCurrentJob = () => {
    return avatarCurrentJob
  }

  const getCurrentGenerating = () => {
    return isAvatarGenerating
  }

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
        <p className="text-gray-600 max-w-3xl mx-auto">
          Create professional avatar videos with Adobe Firefly Services. 
          Select an avatar, choose a voice, and generate stunning videos from your text prompt.
        </p>
        {isDemoMode && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-blue-800 text-sm font-medium">
              Adobe Avatar API not accessible - Using demo mode (credentials configured)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Left Panel - Input Controls */}
        <div className="space-y-6">
          {/* Input Type Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Type</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'text', label: 'Text', icon: '📝' },
                { value: 'textFile', label: 'Text File', icon: '📄' },
                { value: 'audio', label: 'Audio File', icon: '🎵' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInputType(type.value as any)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    inputType === type.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          {inputType === 'text' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Script</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                className={`w-full h-32 p-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                  hasUnsupportedCharacters(prompt) 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-gray-200'
                }`}
              />
              {hasUnsupportedCharacters(prompt) && (
                <div className="mt-2 flex items-center text-yellow-700 text-sm">
                  <div className="w-4 h-4 mr-2">⚠️</div>
                  <span>Text contains emojis or special characters that will be automatically removed</span>
                </div>
              )}
            </div>
          )}

          {/* Text File Upload */}
          {inputType === 'textFile' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Text File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={(e) => setTextFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="textFile"
                />
                <label htmlFor="textFile" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600">
                    {textFile ? textFile.name : 'Click to upload text file'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Supports .txt and .md files</p>
                </label>
              </div>
            </div>
          )}

          {/* Audio File Upload */}
          {inputType === 'audio' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Audio File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept=".wav,.mp3,.m4a"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="audioFile"
                />
                <label htmlFor="audioFile" className="cursor-pointer">
                  <div className="text-4xl mb-2">🎵</div>
                  <p className="text-gray-600">
                    {audioFile ? audioFile.name : 'Click to upload audio file'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Supports .wav, .mp3, and .m4a files</p>
                </label>
              </div>
            </div>
          )}

          {/* Avatar Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Avatar</h3>
            {avatars.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading avatars...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      selectedAvatar === avatar.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-100">
                      <img 
                        src={avatar.thumbnail} 
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${avatar.name}&background=6366f1&color=fff&size=64`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 block">{avatar.name}</span>
                    <p className="text-xs text-gray-500 mt-1 text-center leading-tight">{avatar.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Selection */}
          {(inputType === 'text' || inputType === 'textFile') && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Voice</h3>
              
              {/* Language Filter */}


              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Voice</label>
                {voices.length === 0 ? (
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
                    {selectedVoice
                      .filter(voice => !selectedLanguage || voice.language === selectedLanguage)
                      .map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} ({voice.language}) - {voice.accent} - {voice.gender}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Voice Preview Info */}
              {selectedVoice && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  {(() => {
                    const voice = voices.find(v => v.id === selectedVoice)
                    return voice ? (
                      <div className="text-sm text-gray-600">
                        <p><strong>Language:</strong> {voice.language}</p>
                        <p><strong>Accent:</strong> {voice.accent}</p>
                        <p><strong>Gender:</strong> {voice.gender}</p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Background Options */}
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

        {/* Right Panel - Video Screen */}
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
                    setSelectedLanguage('')
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
        </div>
      </div>

    </div>
  )
}
