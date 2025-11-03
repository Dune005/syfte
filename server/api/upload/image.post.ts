import { randomUUID } from 'crypto';
import { z } from 'zod';
import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { put } from '@vercel/blob';
import { Readable } from 'stream';

// Validation schema
const uploadImageSchema = z.object({
  file: z.any(),
  type: z.enum(['profile', 'goal'], { 
    message: 'Type muss "profile" oder "goal" sein.'
  })
});

// Allowed file types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// No need for FTP config anymore, using Vercel Blob

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  assertMethod(event, 'POST');
  
  try {
    // Get auth token from cookie
    const token = getAuthCookie(event);
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Nicht authentifiziert.'
      });
    }

    // Verify JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültiges Token.'
      });
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Keine Datei hochgeladen.'
      });
    }

    // Find file and type in form data
    const fileData = formData.find(field => field.name === 'file');
    const typeData = formData.find(field => field.name === 'type');
    
    if (!fileData || !fileData.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Datei ist erforderlich.'
      });
    }

    if (!typeData || !typeData.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Upload-Typ ist erforderlich.'
      });
    }

    const type = typeData.data.toString();
    const filename = fileData.filename || 'unknown';
    const fileBuffer = fileData.data;
    const mimeType = fileData.type || '';

    // Validate type
    if (!['profile', 'goal'].includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültiger Upload-Typ.'
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP.'
      });
    }

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Datei zu groß. Maximum: 5MB.'
      });
    }

    // Generate unique filename with proper extension
    const ext = filename.split('.').pop() || 'jpg';
    const uniqueFilename = `${type}-${payload.userId}-${Date.now()}-${randomUUID()}.${ext}`;
    
    // Determine path based on type
    const filepath = `${type === 'profile' ? 'profile' : 'goals'}/${uniqueFilename}`;

    try {
      // Upload to Vercel Blob
      const blob = await put(filepath, fileBuffer, {
        access: 'public',
        contentType: mimeType || 'image/jpeg',
        addRandomSuffix: false, // Use our own unique filename
        token: process.env.SYFTE_BLOB_READ_WRITE_TOKEN // Verwende den custom Token-Namen
      });
      
      return {
        success: true,
        message: 'Bild erfolgreich hochgeladen.',
        imageUrl: blob.url,
        filename: uniqueFilename,
        originalName: filename,
        size: fileBuffer.length,
        type: mimeType
      };
    } catch (uploadError) {
      console.error('Blob upload error:', uploadError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Fehler beim Hochladen der Datei.'
      });
    }

  } catch (error: any) {
    // If it's already an H3Error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Log the error for debugging
    console.error('Image upload error:', error);

    // Return generic error to client
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Hochladen des Bildes.'
    });
  }
});