import { randomUUID } from 'crypto';
import path from 'path';
import { z } from 'zod';
import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { Client } from 'basic-ftp';
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

// FTP configuration from environment variables
const FTP_CONFIG = {
  host: process.env.FTP_HOST || 'exigo-ws82.exigo.ch',
  user: process.env.FTP_USER || 'syfte_ftp',
  password: process.env.FTP_PASSWORD,
  secure: false,
  port: parseInt(process.env.FTP_PORT || '21')
};

// Base URL for public access to uploaded images
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || 'https://www.syfte.ch/images_sparziele';

console.log(IMAGE_BASE_URL);

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

    // Generate unique filename
    const ext = path.extname(filename) || '.jpg';
    const uniqueFilename = `${type}-${payload.userId}-${Date.now()}-${randomUUID()}${ext}`;

    // Upload to FTP server
    const client = new Client();
    try {
      // Validate FTP configuration
      if (!FTP_CONFIG.password) {
        throw createError({
          statusCode: 500,
          statusMessage: 'FTP-Serverkonfiguration unvollständig.'
        });
      }
      
      await client.access(FTP_CONFIG);
      
      // Ensure the images_sparziele directory exists in web root
      await client.ensureDir('/htdocs/images_sparziele');
      
      // Upload file to FTP server
      const remotePath = `/htdocs/images_sparziele/${uniqueFilename}`;
      const readableStream = Readable.from(fileBuffer);
      await client.uploadFrom(readableStream, remotePath);
      
      // Generate public URL
      const publicUrl = `${IMAGE_BASE_URL}/${uniqueFilename}`;
      console.log(publicUrl);
      
      return {
        success: true,
        message: 'Bild erfolgreich hochgeladen.',
        imageUrl: publicUrl,
        filename: uniqueFilename,
        originalName: filename,
        size: fileBuffer.length,
        type: mimeType
      };
    } catch (ftpError) {
      console.error('FTP upload error:', ftpError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Fehler beim Hochladen auf den FTP-Server.'
      });
    } finally {
      client.close();
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