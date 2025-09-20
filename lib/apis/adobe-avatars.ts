import { log } from "console"

interface AdobeAvatarConfig {
  clientId: string
  clientSecret: string
  accessToken?: string
}

interface ScriptInput {
  text: string
  mediaType: 'text/plain'
  localeCode: string
}

interface ScriptFileInput {
  source: {
    url: string
  }
  mediaType: 'text/plain'
  localeCode: string
}

interface AudioInput {
  source: {
    url: string
  }
  mediaType: 'audio/wav' | 'audio/mp3' | 'audio/m4a'
  localeCode: string
}

interface BackgroundConfig {
  type: 'color' | 'transparent' | 'image' | 'video'
  color?: string
  source?: {
    url: string
  }
}

interface AvatarGenerationRequest {
  script?: ScriptInput | ScriptFileInput
  audio?: AudioInput
  voiceId?: string
  avatarId: string
  output: {
    mediaType: 'video/mp4' | 'video/webm'
    background?: BackgroundConfig
  }
}

interface AvatarGenerationResponse {
  jobId: string
  status: string
  output?: {
    destination: {
      url: string
    }
  }
}

interface Avatar {
  id: string
  name: string
  description: string
  thumbnail: string
  gender: 'male' | 'female'
  age: string
  ethnicity: string
}

interface Voice {
  voiceId: string
  displayName: string
  style: string
  gender: string
  language: string
  accent: string
  sampleURL?: string
}

export class AdobeAvatarAPI {
  private config: AdobeAvatarConfig
  private baseUrl = 'https://audio-video-api.adobe.io/v1'
  private cachedToken: { accessToken: string; expiry: number } | null = null;

  

  constructor(config: AdobeAvatarConfig) {
    this.config = {
      clientId: config.clientId || process.env.ADOBE_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.ADOBE_CLIENT_SECRET || '',
    }
  }

  public async getAccessToken(): Promise<string | null> {
  

    if (this.cachedToken && Date.now() < this.cachedToken.expiry) {
      return this.cachedToken.accessToken;
    }
        
  
    const url = "https://ims-na1.adobelogin.com/ims/token/v3";
    const { clientId, clientSecret } = this.config;
  
    if (!clientId || !clientSecret) {
      throw new Error("Adobe client ID or client secret is not configured");
    }
  
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("scope", "openid,AdobeID,firefly_enterprise");
  

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
  
      if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      // console.log(data);
      
      // console.log("✅ Adobe Access Token acquired");
      // return data.access_token as string;

      this.cachedToken = {
        accessToken: data.access_token,
        expiry: Date.now() + data.expires_in * 1000 // use Adobe's expiry
      };

        return this.cachedToken.accessToken;

    } catch (error: any) {
      console.error("❌ Error fetching Adobe access token:", error.message);
      return null;
    }
  }
  

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken()

    // console.log(token);
    

    const avat = 'https://audio-video-api.adobe.io/v1/'
    
    const response = await fetch(`${avat}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': this.config.clientId,
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      let errorMessage = `Adobe API Error: ${response.status} - ${error}`
      
      // Provide more specific error messages for common issues
      if (response.status === 422) {
        try {
          const errorData = JSON.parse(error)
          if (errorData.error_code === 'validation_error') {
            errorMessage = `Adobe API Validation Error: ${errorData.message || error}`
          }
        } catch (parseError) {
          // If we can't parse the error, use the original message
        }
      } else if (response.status === 404) {
        errorMessage = `Adobe API Error: Resource not found (404) - The requested job or endpoint may not exist. Error: ${error}`
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }
  

  async generateAvatarVideo(request: AvatarGenerationRequest): Promise<AvatarGenerationResponse> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Adobe credentials not configured');
    }
    console.log(request);
    
    const token = await this.getAccessToken();
    const baseUrl = 'https://audio-video-api.adobe.io/v1'; // no trailing slash

    try {
      const response = await fetch(`${baseUrl}/generate-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': this.config.clientId
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Adobe API failed: ${response.status} - ${response.statusText}\n${errText}`);
      }

      const job = await response.json();
      console.log("Job started:", job); // contains jobId

      return job;
    } catch (error) {
      console.error('Adobe API failed:', error);
      throw new Error('Adobe Avatar API not accessible');
    }
  }




  // Generate video from text input
  async generateFromText(params: {
    text: string
    avatarId: string
    voiceId: string
    localeCode?: string
    backgroundType?: 'color' | 'transparent' | 'image' | 'video'
    backgroundColor?: string
    backgroundUrl?: string
    outputFormat?: 'video/mp4' | 'video/webm'
  }): Promise<AvatarGenerationResponse> {
    // Sanitize text input to remove unsupported characters
    const sanitizedText = this.sanitizeText(params.text)
    
    const request: AvatarGenerationRequest = {
      script: {
        text: sanitizedText,
        mediaType: 'text/plain',
        localeCode: params.localeCode || 'en-US'
      },
      voiceId: params.voiceId,
      avatarId: params.avatarId,
      output: {
        mediaType: params.outputFormat || 'video/mp4'
      }
    }

    // Add background configuration if provided
    if (params.backgroundType) {
      request.output.background = {
        type: params.backgroundType
      }

      if (params.backgroundType === 'color' && params.backgroundColor) {
        request.output.background.color = params.backgroundColor
      } else if ((params.backgroundType === 'image' || params.backgroundType === 'video') && params.backgroundUrl) {
        request.output.background.source = {
          url: params.backgroundUrl
        }
      }
    }

    return this.generateAvatarVideo(request)
  }

  // Generate video from text file
  async generateFromTextFile(params: {
    textFileUrl: string
    avatarId: string
    voiceId: string
    localeCode?: string
    backgroundType?: 'color' | 'transparent' | 'image' | 'video'
    backgroundColor?: string
    backgroundUrl?: string
    outputFormat?: 'video/mp4' | 'video/webm'
  }): Promise<AvatarGenerationResponse> {
    const request: AvatarGenerationRequest = {
      script: {
        source: {
          url: params.textFileUrl
        },
        mediaType: 'text/plain',
        localeCode: params.localeCode || 'en-US'
      },
      voiceId: params.voiceId,
      avatarId: params.avatarId,
      output: {
        mediaType: params.outputFormat || 'video/mp4'
      }
    }

    // Add background configuration if provided
    if (params.backgroundType) {
      request.output.background = {
        type: params.backgroundType
      }

      if (params.backgroundType === 'color' && params.backgroundColor) {
        request.output.background.color = params.backgroundColor
      } else if ((params.backgroundType === 'image' || params.backgroundType === 'video') && params.backgroundUrl) {
        request.output.background.source = {
          url: params.backgroundUrl
        }
      }
    }

    return this.generateAvatarVideo(request)
  }

  // Generate video from audio file
  async generateFromAudio(params: {
    audioFileUrl: string
    avatarId: string
    audioFormat?: 'audio/wav' | 'audio/mp3' | 'audio/m4a'
    localeCode?: string
    backgroundType?: 'color' | 'transparent' | 'image' | 'video'
    backgroundColor?: string
    backgroundUrl?: string
    outputFormat?: 'video/mp4' | 'video/webm'
  }): Promise<AvatarGenerationResponse> {
    const request: AvatarGenerationRequest = {
      audio: {
        source: {
          url: params.audioFileUrl
        },
        mediaType: params.audioFormat || 'audio/wav',
        localeCode: params.localeCode || 'en-US'
      },
      avatarId: params.avatarId,
      output: {
        mediaType: params.outputFormat || 'video/mp4'
      }
    }

    // Add background configuration if provided
    if (params.backgroundType) {
      request.output.background = {
        type: params.backgroundType
      }

      if (params.backgroundType === 'color' && params.backgroundColor) {
        request.output.background.color = params.backgroundColor
      } else if ((params.backgroundType === 'image' || params.backgroundType === 'video') && params.backgroundUrl) {
        request.output.background.source = {
          url: params.backgroundUrl
        }
      }
    }

    return this.generateAvatarVideo(request)
  }

  async getJobStatus(jobId: string): Promise<AvatarGenerationResponse> {
    if (!this.config.clientId || !this.config.clientSecret || this.config.clientId === '') {
      throw new Error('Adobe credentials not configured');
    }

    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
      throw new Error('Invalid job ID provided');
    }

    console.log(`Checking job status for jobId: ${jobId}`);
    const token = await this.getAccessToken();

    try {
      const endpoint = 'https://api.adobe.io/api/adobe-avatar/generate';
      const result = await fetch(`${endpoint}?jobId=${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': this.config.clientId
        }
      });

      if (!result.ok) {
        console.log(`Adobe API returned status ${result.status}`);
        return { jobId, status: 'processing' };
      }

      const data = await result.json();
      console.log(`Job status response for ${jobId}:`, data);
      return data;

    } catch (error) {
      console.log('Adobe API failed:', error);
      return { jobId, status: 'processing' };
    }
  }


  private getDemoJobStatus(jobId: string): AvatarGenerationResponse {
    // Return processing status - no demo video URLs
    return {
      jobId,
      status: 'processing'
    }
  }

  private sanitizeText(text: string): string {
    // Remove emojis and special symbols that Adobe API doesn't support
    return text
      // Remove common emojis and symbols
      .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous symbols
      .replace(/[\u2700-\u27BF]/g, '') // Dingbats
      .replace(/[\uD83C-\uD83D][\uDC00-\uDFFF]/g, '') // Emoticons and symbols
      .replace(/[\uD83E][\uDD00-\uDDFF]/g, '') // Supplemental symbols
      // Remove other special characters
      .replace(/[^\w\s.,!?;:'"()-]/g, '') // Keep only alphanumeric, spaces, and basic punctuation
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
  }

  async getAvatars(): Promise<Avatar[]> {
    try {
      const response = await this.makeRequest('/avatars')

    
      const avatars = response?.data;
    
      if (avatars && Array.isArray(avatars) && avatars.length > 0) {
        return avatars.map((avatar: any) => ({
          id: avatar.avatarId,
          name: avatar.displayName,
          description: `${avatar.clothingStyle} ${avatar.ageGroup} ${avatar.ethnicity}`,
          thumbnail: avatar.thumbnailUrls?.lowRes || avatar.thumbnailUrls?.hd || '',
          gender: avatar.gender.toLowerCase(),
          age: avatar.ageGroup,
          ethnicity: avatar.ethnicity
        }));
      }

      return response
    } catch (error) {
      console.error('Error fetching avatars:', error)
      return []
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await this.makeRequest('/voices')
      
      // Handle different response structures from Adobe API
      let voicesData = response
      
      // If response has a data property, use that
      if (response && response.data && Array.isArray(response.data)) {
        voicesData = response.data
      }
      // If response is already an array, use it directly
      else if (response && Array.isArray(response)) {
        voicesData = response
      }
      // If response has a voices property, use that
      else if (response && response.voices && Array.isArray(response.voices)) {
        voicesData = response.voices
      }
      // If none of the above, return empty array
      else {
        console.log('Unexpected voices response structure:', response)
        return []
      }
      
      // Map Adobe voice data to our interface
      if (voicesData && Array.isArray(voicesData) && voicesData.length > 0) {
        return voicesData.map((voice: any) => ({
          voiceId: voice.voiceId,
          displayName: voice.displayName || voice.name || 'Unknown Voice',
          style: voice.style || voice.accent || 'Standard',
          gender: voice.gender || 'unknown',
          language: voice.language || 'en-US',
          accent: voice.accent || voice.region || 'Standard',
          sampleURL: voice.sampleURL || null
        }))
      }
      
      return []
    } catch (error) {
      console.error('Error fetching voices:', error)
      return []
    }
  }

  private async validateVoiceId(voiceId: string): Promise<boolean> {
    try {
      // Try to get real voices from Adobe API
      const voices = await this.getVoices()
      
      // Ensure voices is an array
      const voicesArray = Array.isArray(voices) ? voices : []
      
      // If no voices available from API, return false
      if (!voicesArray || voicesArray.length === 0) {
        console.log('No voices available from Adobe API')
        return false
      }
      
      const validVoiceIds = voicesArray.map(voice => voice.voiceId)
      return validVoiceIds.includes(voiceId)
    } catch (error) {
      console.error('Error validating voice ID:', error)
      // If validation fails, assume it's invalid
      return false
    }
  }
}
