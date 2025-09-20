'use client'

import { useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface VideoGenerationParams {
  prompt: string
  style: 'cinematic' | 'animated' | 'documentary' | 'commercial' | 'social' | 'music'
  duration: number
  resolution?: '720p' | '1080p' | '4k'
  userId?: string
}

interface VideoJob {
  id: string
  status: string
  progress: number
  prompt: string
  style: string
  duration: number
  resolution: string
  userId?: string
  createdAt: string
  estimatedCompletion: string
  result?: {
    videoUrl: string
    thumbnailUrl: string
    duration: number
    resolution: string
    fileSize: string
    format: string
  }
  error?: string
  message?: string
}

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null)
  const [jobs, setJobs] = useState<VideoJob[]>([])

  const generateVideo = useCallback(async (params: VideoGenerationParams) => {
    try {
      setIsGenerating(true)
      
      const response = await axios.post('/api/video/generate', {
        prompt: params.prompt,
        style: params.style,
        duration: params.duration,
        resolution: params.resolution || '1080p',
        userId: params.userId
      })

      if (response.data.success) {
        const jobData = response.data.data
        setCurrentJob({
          id: jobData.jobId,
          status: jobData.status,
          progress: jobData.progress,
          prompt: params.prompt,
          style: params.style,
          duration: params.duration,
          resolution: params.resolution || '1080p',
          userId: params.userId,
          createdAt: new Date().toISOString(),
          estimatedCompletion: jobData.estimatedCompletion,
          message: jobData.message
        })
        
        toast.success('Video generation started!')
        return jobData.jobId
      } else {
        throw new Error(response.data.error || 'Failed to start video generation')
      }
    } catch (error: any) {
      console.error('Video generation error:', error)
      toast.error(error.response?.data?.message || 'Failed to start video generation')
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const getJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await axios.get(`/api/video/generate?jobId=${jobId}`)
      
      if (response.data.success) {
        const job = response.data.data
        setCurrentJob(job)
        
        // Update jobs list
        setJobs(prev => {
          const existingIndex = prev.findIndex(j => j.id === jobId)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = job
            return updated
          } else {
            return [...prev, job]
          }
        })
        
        return job
      } else {
        throw new Error(response.data.error || 'Failed to get job status')
      }
    } catch (error: any) {
      console.error('Get job status error:', error)
      throw error
    }
  }, [])

  const getAllJobs = useCallback(async (userId?: string) => {
    try {
      const url = userId 
        ? `/api/video/generate?userId=${userId}`
        : '/api/video/generate'
        
      const response = await axios.get(url)
      
      if (response.data.success) {
        const jobsData = response.data.data
        setJobs(jobsData)
        return jobsData
      } else {
        throw new Error(response.data.error || 'Failed to get jobs')
      }
    } catch (error: any) {
      console.error('Get all jobs error:', error)
      throw error
    }
  }, [])

  const pollJobStatus = useCallback(async (jobId: string, onUpdate?: (job: VideoJob) => void) => {
    const poll = async () => {
      try {
        const job = await getJobStatus(jobId)
        onUpdate?.(job)
        
        if (job.status === 'processing') {
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else if (job.status === 'completed') {
          toast.success('Video generation completed!')
        } else if (job.status === 'failed') {
          toast.error('Video generation failed')
        }
      } catch (error) {
        console.error('Polling error:', error)
        setTimeout(poll, 5000) // Retry after 5 seconds on error
      }
    }
    
    poll()
  }, [getJobStatus])

  const downloadVideo = useCallback(async (videoUrl: string, filename?: string) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `ai-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Video downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download video')
    }
  }, [])

  return {
    isGenerating,
    currentJob,
    jobs,
    generateVideo,
    getJobStatus,
    getAllJobs,
    pollJobStatus,
    downloadVideo
  }
}









