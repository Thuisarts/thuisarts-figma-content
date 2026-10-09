// Vercel-variant van de proxy: dezelfde code als de Cloudflare Worker, als Edge Function.
import worker from '../worker.js';

export const config = { runtime: 'edge' };

export default function handler(request) {
  return worker.fetch(request);
}
