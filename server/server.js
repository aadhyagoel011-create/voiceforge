import app from './app.js';
import { StorageService } from './services/storage.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Initialize data storage and load sample data if empty
    await StorageService.init();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🎙️  VoiceForge Backend Server running on port ${PORT}`);
      console.log(`🌐 API base: http://localhost:${PORT}/api`);
      console.log(`🔒 ElevenLabs API Key configured: ${process.env.ELEVENLABS_API_KEY ? 'YES (Masked)' : 'NO (Demo Mode Active)'}`);
      console.log(`🤖 ElevenLabs Agent ID configured: ${process.env.ELEVENLABS_AGENT_ID ? 'YES' : 'NO'}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start VoiceForge server:', err);
    process.exit(1);
  }
}

bootstrap();
