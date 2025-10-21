import { supabase } from '@/lib/supabase'
import { ProgressTracker } from './errorHandling'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

export interface ImageProcessingOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  quality?: number
  onProgress?: (progress: { current: number; total: number; message: string }) => void
}

export interface BatchProcessingResult {
  successful: Array<{ original: string; processed: string }>
  failed: Array<{ original: string; error: string }>
  skipped: string[]
  totalProcessed: number
  processingTime: number
}

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly originalUrl: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = true
  ) {
    super(message)
    this.name = 'ImageProcessingError'
  }
}

export async function processAndUploadImage(
  imageUrl: string,
  options: ImageProcessingOptions = {}
): Promise<string> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    quality = 85,
    onProgress
  } = options

  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new ImageProcessingError('Invalid image URL provided', imageUrl, 400, false)
  }

  onProgress?.({ current: 0, total: 100, message: `Starting image processing for ${imageUrl}` })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      onProgress?.({
        current: attempt * 20,
        total: 100,
        message: `Attempt ${attempt}/${maxRetries}: Fetching image...`
      })

      const proxyUrl = import.meta.env.VITE_IMAGE_PROXY_URL || `${supabaseUrl}/functions/v1/image-proxy`
      const encodedImageUrl = encodeURIComponent(imageUrl)
      const fullProxyUrl = `${proxyUrl}?url=${encodedImageUrl}&quality=${quality}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(fullProxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'UGC-Management-Hub/1.0'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const retryable = response.status >= 500 || response.status === 429
        throw new ImageProcessingError(
          `Failed to download image: ${response.status} ${response.statusText}`,
          imageUrl,
          response.status,
          retryable
        )
      }

      onProgress?.({ current: 60, total: 100, message: 'Image downloaded, uploading to storage...' })

      const imageBuffer = await response.arrayBuffer()

      if (imageBuffer.byteLength === 0) {
        throw new ImageProcessingError('Downloaded image is empty', imageUrl, 400, false)
      }

      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const filename = `ugc/user_post_${timestamp}_${randomString}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('ugc-images')
        .upload(filename, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        throw new ImageProcessingError(
          `Failed to upload to Supabase: ${uploadError.message}`,
          imageUrl,
          500,
          true
        )
      }

      onProgress?.({ current: 90, total: 100, message: 'Getting public URL...' })

      const { data: publicUrlData } = supabase.storage
        .from('ugc-images')
        .getPublicUrl(filename)

      const publicUrl = publicUrlData.publicUrl

      onProgress?.({ current: 100, total: 100, message: 'Image processing complete!' })

      return publicUrl

    } catch (error) {
      if (error instanceof ImageProcessingError && !error.retryable) {
        throw error
      }

      if (attempt === maxRetries) {
        throw new ImageProcessingError(
          `Failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          imageUrl,
          error instanceof ImageProcessingError ? error.statusCode : 500,
          false
        )
      }

      onProgress?.({
        current: attempt * 20,
        total: 100,
        message: `Attempt ${attempt} failed, retrying in ${retryDelay}ms...`
      })

      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }

  throw new ImageProcessingError('Unexpected error in image processing', imageUrl, 500, false)
}

// Helper function to validate if an URL needs processing
export function needsImageProcessing(url: string): boolean {
  // Check if the URL is from Instagram CDN (which often blocks external access)
  const instagramPatterns = [
    'instagram.f',
    'fbcdn.net',
    'cdninstagram.com'
  ]

  return instagramPatterns.some(pattern => url.includes(pattern))
}

// Helper function to check if proxy is available
export async function isProxyAvailable(): Promise<boolean> {
  try {
    const proxyUrl = import.meta.env.VITE_IMAGE_PROXY_URL || `${supabaseUrl}/functions/v1/image-proxy`
    const testUrl = `${proxyUrl}?url=${encodeURIComponent('https://via.placeholder.com/1x1.jpg')}`

    const response = await fetch(testUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
        return false
  }
}

export async function processMultipleImages(
  urls: string[],
  options: ImageProcessingOptions & {
    concurrency?: number
    skipInvalid?: boolean
  } = {}
): Promise<BatchProcessingResult> {
  const startTime = Date.now()
  const {
    concurrency = 3,
    skipInvalid = true,
    onProgress,
    ...imageOptions
  } = options

  if (!Array.isArray(urls) || urls.length === 0) {
    return {
      successful: [],
      failed: [],
      skipped: [],
      totalProcessed: 0,
      processingTime: 0
    }
  }

  const progressTracker = new ProgressTracker()
  progressTracker.reset()

  const validUrls = urls.filter(url => url && typeof url === 'string')
  const urlsNeedingProcessing = validUrls.filter(url => needsImageProcessing(url))
  const urlsToSkip = skipInvalid ? validUrls.filter(url => !needsImageProcessing(url)) : []
  const totalWork = urlsNeedingProcessing.length + urlsToSkip.length

  let processedCount = 0

  const emitProgress = (step: string, message: string) => {
    const percentage = totalWork === 0
      ? 100
      : Math.min(100, Math.round((processedCount / totalWork) * 100))

    progressTracker.updateProgress({
      step,
      percentage,
      current: processedCount,
      total: totalWork,
      message
    })

    onProgress?.({
      current: processedCount,
      total: totalWork,
      message
    })
  }

  emitProgress('Initializing batch', 'Preparing image processing batch...')

  const successful: Array<{ original: string; processed: string }> = []
  const failed: Array<{ original: string; error: string }> = []

  const processSingle = async (url: string): Promise<void> => {
    emitProgress('Processing image', `Processing ${url}`)

    try {
      const processedUrl = await processAndUploadImage(url, {
        ...imageOptions,
        onProgress: (imgProgress) => {
          onProgress?.({
            current: processedCount,
            total: totalWork,
            message: `Image ${imgProgress.current}%: ${imgProgress.message}`
          })
        }
      })

      successful.push({ original: url, processed: processedUrl })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      failed.push({ original: url, error: errorMessage })
    } finally {
      processedCount += 1
      emitProgress('Batch progress', `Finished processing attempt for ${url}`)
    }
  }

  for (let i = 0; i < urlsNeedingProcessing.length; i += concurrency) {
    const batch = urlsNeedingProcessing.slice(i, i + concurrency)
    await Promise.allSettled(batch.map(processSingle))
  }

  if (skipInvalid) {
    urlsToSkip.forEach(url => {
      successful.push({ original: url, processed: url })
      processedCount += 1
      emitProgress('Skipping image', `Skipped ${url} (no processing needed)`)
    })
  }

  if (totalWork === 0) {
    emitProgress('Completed', 'No images required processing')
  } else {
    processedCount = Math.max(processedCount, totalWork)
    emitProgress('Completed', 'Finished processing image batch')
  }

  const processingTime = Date.now() - startTime

  return {
    successful,
    failed,
    skipped: skipInvalid ? urlsToSkip : [],
    totalProcessed: validUrls.length,
    processingTime
  }
}

// Function to delete old images from Supabase Storage (cleanup)
export async function deleteImageFromStorage(publicUrl: string): Promise<boolean> {
  try {
    // Extract filename from public URL
    const urlObj = new URL(publicUrl)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]

    if (!filename) {
            return false
    }

    const { error } = await supabase.storage
      .from('ugc-images')
      .remove([filename])

    if (error) {
            return false
    }

        return true

  } catch (error) {
        return false
  }
}