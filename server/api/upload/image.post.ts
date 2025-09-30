import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

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
const UPLOAD_DIR = 'public/uploads';

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

    // Create upload directory if it doesn't exist
    const uploadPath = path.join(process.cwd(), UPLOAD_DIR);
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(filename) || '.jpg';
    const uniqueFilename = `${type}-${payload.userId}-${Date.now()}-${randomUUID()}${ext}`;
    const filePath = path.join(uploadPath, uniqueFilename);

    // Save file to disk
    await writeFile(filePath, fileBuffer);

    // Generate public URL
    const publicUrl = `/uploads/${uniqueFilename}`;

    return {
      success: true,
      message: 'Bild erfolgreich hochgeladen.',
      imageUrl: publicUrl,
      filename: uniqueFilename,
      originalName: filename,
      size: fileBuffer.length,
      type: mimeType
    };

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