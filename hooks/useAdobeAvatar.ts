import { useState, useCallback, useRef, useEffect } from 'react'

interface Avatar { id: string; name: string; description: string; thumbnail: string; gender: 'male' | 'female'; age: string; ethnicity: string }
interface Voice { voiceId: string; displayName: string; style: string; gender: string; language: string; accent: string; sampleURL?: string }
interface AdobeAvatarJob { jobId: string; status: string; output?: { destination: { url: string } } }
interface AdobeAvatarParams {
  inputType?: 'text' | 'textFile' | 'audio'
  prompt?: string
  avatarId: string
  voiceId?: string
  localeCode?: string
  backgroundType?: 'color' | 'transparent' | 'image' | 'video'
  backgroundColor?: string
  backgroundUrl?: string
  userId?: string
  textFileUrl?: string
  audioFileUrl?: string
  audioFormat?: 'audio/wav' | 'audio/mp3' | 'audio/m4a'
  outputFormat?: 'video/mp4' | 'video/webm'
}

export function useAdobeAvatar() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<AdobeAvatarJob | null>(null)
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [voices, setVoices] = useState<Voice[]>([])

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate avatar job
  const generateAvatarVideo = useCallback(async (params: AdobeAvatarParams): Promise<string | null> => {
    try {
      setIsGenerating(true)

      const response = await fetch('/api/adobe-avatar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message || 'Failed to start avatar generation')

      const job: AdobeAvatarJob = { 
        jobId: result.data.jobId, 
        status: result.data.status
      }
      setCurrentJob(job)
      return job.jobId
    } catch (error) {
      console.error('Avatar generation error:', error)
      setIsGenerating(false)
      throw error
    }
  }, [])

  // Poll job status
  const pollJobStatus = useCallback((jobId: string, onUpdate: (job: AdobeAvatarJob) => void) => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/adobe-avatar/generate?jobId=${jobId}`)
        const result = await response.json()
        console.log(result);
        

        if (result.success) {
          const job: AdobeAvatarJob = result.data
          setCurrentJob(job)
          onUpdate(job)

          if (job.status === 'succeeded' || job.status === 'failed') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setIsGenerating(false)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(pollRef.current!)
        pollRef.current = null
        setIsGenerating(false)
      }
    }, 3000)

    // Safety cleanup after 5 minutes
    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      setIsGenerating(false)
    }, 300_000)
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  // Fetch avatars
    async function getAvatars(): Promise<Avatar[]> {
      try {
        // 1️⃣ Try localStorage first
        const cached = localStorage.getItem("adobeAvatars");
        if (cached) {
          const parsed = JSON.parse(cached);
          console.log(parsed);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAvatars(parsed);
            return parsed as Avatar[];
          }
        }

        // 2️⃣ Fallback: fetch from API
        const response = await fetch("/api/adobe-avatar/avatars");
        const result = await response.json();

        if (result?.success && Array.isArray(result.data)) {
          setAvatars(result.data);
          localStorage.setItem("adobeAvatars", JSON.stringify(result.data)); // save for reuse
          return result.data as Avatar[];
        } else {
          console.warn("Get avatars returned no data:", result);
        }
      } catch (error) {
        console.error("Get avatars error:", error);
      }

      return [];
    }


  // Fetch voices
const getVoices = useCallback(async () => {
  try {
    // 1️⃣ Try reading from localStorage first
    const cached = localStorage.getItem("adobeVoices");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setVoices(parsed);
        return parsed;
      }
    }

    // 2️⃣ Fallback: fetch from API if no cached data
    const response = await fetch("/api/adobe-avatar/voices");
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      setVoices(result.data);
      localStorage.setItem("adobeVoices", JSON.stringify(result.data)); // store in localStorage
      return result.data;
    } else {
      console.warn("Get voices returned invalid data:", result);
      setVoices([]);
      return [];
    }
  } catch (error) {
    console.error("Get voices error:", error);
    setVoices([]);
    return [];
  }
}, []);


  // Download video
  const downloadVideo = useCallback((videoUrl: string) => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `adobe-avatar-video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return {
    isGenerating,
    currentJob,
    avatars,
    voices,
    generateAvatarVideo,
    pollJobStatus,
    getAvatars,
    getVoices,
    downloadVideo
  }
}
