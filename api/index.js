import { app, connectDb, initDb } from '../server/index.js';

let isReady = false;

async function ensureDbReady() {
  if (!isReady) {
    await connectDb();
    await initDb();
    isReady = true;
  }
}

export default async function handler(req, res) {
  try {
    await ensureDbReady();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Handler Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}

