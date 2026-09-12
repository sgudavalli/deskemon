export type VoiceCue = 'water' | 'conflict';

export const VOICE_COPY: Record<VoiceCue, string> = {
  water: "Hey Champ, quick hydration check. Take a sip of water. I'll hold your place.",
  conflict:
    'Champ, that conflicts with the hackathon demo, which runs until six. Want me to move final prototypes to six?',
};

const cueAudio = new Map<VoiceCue, Promise<ArrayBuffer>>();
let audioContext: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let activeAudio: HTMLAudioElement | null = null;

export function unlockVoicePlayback() {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  void audioContext.resume();

  // Starting a silent buffer inside the touch event unlocks later playback on iOS.
  const silence = audioContext.createBuffer(1, 1, 22050);
  const source = audioContext.createBufferSource();
  source.buffer = silence;
  source.connect(audioContext.destination);
  source.start(0);
}

function loadCue(cue: VoiceCue) {
  const existing = cueAudio.get(cue);
  if (existing) return existing;

  const pending = fetch('/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cue }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Voice service unavailable');
      return response.arrayBuffer();
    })
    .catch((error) => {
      cueAudio.delete(cue);
      throw error;
    });

  cueAudio.set(cue, pending);
  return pending;
}

export function preloadVoiceCues(cues: VoiceCue[]) {
  cues.forEach((cue) => void loadCue(cue).catch(() => undefined));
}

function speakWithBrowserVoice(text: string) {
  return new Promise<void>((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakCue(cue: VoiceCue) {
  try {
    const audioData = await loadCue(cue);

    if (audioContext) {
      await audioContext.resume();
      activeSource?.stop();
      const buffer = await audioContext.decodeAudioData(audioData.slice(0));
      const source = audioContext.createBufferSource();
      activeSource = source;
      source.buffer = buffer;
      source.connect(audioContext.destination);
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start(0);
      });
      return;
    }

    activeAudio?.pause();
    const objectUrl = URL.createObjectURL(new Blob([audioData], { type: 'audio/mpeg' }));
    const audio = new Audio(objectUrl);
    activeAudio = audio;
    audio.volume = 1;
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
      audio.onerror = () => reject(new Error('Voice playback failed'));
      void audio.play().catch(reject);
    });
  } catch {
    await speakWithBrowserVoice(VOICE_COPY[cue]);
  }
}
