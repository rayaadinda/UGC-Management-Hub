import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function processAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    
    // Step 1: Download the image data via our proxy to avoid CORS
    const proxyUrl = import.meta.env.VITE_IMAGE_PROXY_URL || `${supabaseUrl}/functions/v1/image-proxy`
    const encodedImageUrl = encodeURIComponent(imageUrl)
    const fullProxyUrl = `${proxyUrl}?url=${encodedImageUrl}`

    
    const response = await fetch(fullProxyUrl)

    if (!response.ok) {
      throw new Error(`Failed to download image via proxy: ${response.status} ${response.statusText}`)
    }

    // Convert response to ArrayBuffer
    const imageBuffer = await response.arrayBuffer()
    
    // Step 2: Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const filename = `ugc/user_post_${timestamp}_${randomString}.jpg`

    
    // Step 3: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ugc-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`)
    }

    
    // Step 4: Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('ugc-images')
      .getPublicUrl(filename)

    const publicUrl = publicUrlData.publicUrl
    
    // Step 5: Return the new public URL
    return publicUrl

  } catch (error) {
    console.error('Error processing and uploading image:')
    return null
  }
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
    console.warn('Image proxy not available:')
    return false
  }
}

// Batch processing function for multiple images
export async function processMultipleImages(urls: string[]): Promise<{success: string[], failed: string[]}> {
  const success: string[] = []
  const failed: string[] = []

  for (const url of urls) {
    if (!url || !needsImageProcessing(url)) {
      // Skip empty URLs or URLs that don't need processing
      if (url) success.push(url)
      continue
    }

    
    try {
      const newUrl = await processAndUploadImage(url)
      if (newUrl) {
        success.push(newUrl)
      } else {
        failed.push(url)
      }
    } catch (error) {
      console.error('Failed to process image:', url)
      failed.push(url)
    }
  }

    return { success, failed }
}

// Function to delete old images from Supabase Storage (cleanup)
export async function deleteImageFromStorage(publicUrl: string): Promise<boolean> {
  try {
    // Extract filename from public URL
    const urlObj = new URL(publicUrl)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]

    if (!filename) {
      console.warn('Could not extract filename from URL')
      return false
    }

    const { error } = await supabase.storage
      .from('ugc-images')
      .remove([filename])

    if (error) {
      console.error('Failed to delete image from storage:')
      return false
    }

        return true

  } catch (error) {
    console.error('Error deleting image from storage:')
    return false
  }
}