const PREFERRED_VOICE_PATTERNS: RegExp[] = [
  /neural/i,
  /natural/i,
  /premium/i,
  /enhanced/i,
  /online/i,
  /samantha/i,
  /aaron/i,
  /guy/i,
  /aria/i,
  /daniel/i,
  /karen/i,
  /google.*english/i,
  /microsoft/i,
];

const AVOID_VOICE_PATTERNS: RegExp[] = [
  /zarvox/i,
  /whisper/i,
  /robot/i,
  /espeak/i,
  /fred/i,
  /ralph/i,
  /victoria/i,
];

const BROWSER_SPEECH_SETTINGS = {
  rate: 0.9,
  pitch: 1.02,
  volume: 1,
} as const;

let cachedChefVoice: SpeechSynthesisVoice | null | undefined;

function voiceLabel(voice: SpeechSynthesisVoice): string {
  return `${voice.name} ${voice.voiceURI}`;
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const label = voiceLabel(voice);

  if (voice.lang.toLowerCase().startsWith("en")) score += 12;
  if (voice.lang.toLowerCase() === "en-us") score += 6;
  if (!voice.localService) score += 4;

  for (const pattern of PREFERRED_VOICE_PATTERNS) {
    if (pattern.test(label)) score += 18;
  }

  for (const pattern of AVOID_VOICE_PATTERNS) {
    if (pattern.test(label)) score -= 80;
  }

  return score;
}

function pickChefVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );
  const candidates = englishVoices.length > 0 ? englishVoices : voices;
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

function loadChefVoice(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve(null);
  }

  if (cachedChefVoice !== undefined) {
    return Promise.resolve(cachedChefVoice);
  }

  const synth = window.speechSynthesis;

  return new Promise((resolve) => {
    const resolveVoice = () => {
      const voice = pickChefVoice(synth.getVoices());
      cachedChefVoice = voice;
      resolve(voice);
    };

    const voices = synth.getVoices();
    if (voices.length > 0) {
      resolveVoice();
      return;
    }

    const onVoicesChanged = () => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolveVoice();
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);
    window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolveVoice();
    }, 500);
  });
}

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function cancelBrowserSpeech(): void {
  if (!isBrowserSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speakWithBrowser(
  text: string,
  handlers: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  } = {}
): SpeechSynthesisUtterance | null {
  if (!isBrowserSpeechSupported() || !text.trim()) return null;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = BROWSER_SPEECH_SETTINGS.rate;
  utterance.pitch = BROWSER_SPEECH_SETTINGS.pitch;
  utterance.volume = BROWSER_SPEECH_SETTINGS.volume;
  utterance.lang = "en-US";

  void loadChefVoice().then((voice) => {
    if (voice) utterance.voice = voice;
    utterance.onstart = () => handlers.onStart?.();
    utterance.onend = () => handlers.onEnd?.();
    utterance.onerror = () => handlers.onError?.();
    synth.speak(utterance);
  });

  return utterance;
}
