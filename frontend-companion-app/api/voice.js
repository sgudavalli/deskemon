const CUES = {
  water: "Hey Champ, quick hydration check. Take a sip of water. I'll hold your place.",
  conflict:
    'Champ, that conflicts with the hackathon demo, which runs until six. Want me to move final prototypes to six?',
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const cue = request.body?.cue;
  const text = CUES[cue];

  if (!text) {
    return response.status(400).json({ error: 'Unknown voice cue' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return response.status(503).json({ error: 'Voice is not configured' });
  }

  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.58,
            similarity_boost: 0.76,
            style: 0.12,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!elevenLabsResponse.ok) {
      return response.status(502).json({ error: 'Voice generation failed' });
    }

    const audio = Buffer.from(await elevenLabsResponse.arrayBuffer());
    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return response.status(200).send(audio);
  } catch {
    return response.status(502).json({ error: 'Voice generation failed' });
  }
}
