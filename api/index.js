import app from '../server/app.js';
import { StorageService } from '../server/services/storage.js';

let initialized = false;

/**
 * Vercel Serverless Function Handler
 * Automatically routes all incoming /api/* requests to the Express application
 */
export default async function handler(req, res) {
  if (!initialized) {
    try {
      await StorageService.init();
      initialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] Storage initialization note:', err.message);
    }
  }
  return app(req, res);
}
