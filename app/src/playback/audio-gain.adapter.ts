export function createAudioGain() {
  let context: AudioContext | null = null;
  const samples = new Uint8Array(256);
  const nodes = new Map<HTMLMediaElement, { source: MediaElementAudioSourceNode; gain: GainNode; analyser: AnalyserNode }>();
  function attach(media: HTMLMediaElement) {
    if (nodes.has(media)) return;
    context ??= new AudioContext();
    const source = context.createMediaElementSource(media), gain = context.createGain(), analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(gain); gain.connect(analyser); analyser.connect(context.destination);
    nodes.set(media, { source, gain, analyser }); media.volume = 1;
  }
  return {
    resume: async () => { if (context?.state === 'suspended') await context.resume(); },
    set(media: HTMLMediaElement, volume: number) {
      attach(media);
      const gain = nodes.get(media)!.gain.gain;
      if (gain.value !== volume / 100) gain.value = volume / 100;
    },
    detach(media: HTMLMediaElement) {
      const node = nodes.get(media);
      if (node) { node.source.disconnect(); node.gain.disconnect(); node.analyser.disconnect(); nodes.delete(media); }
    },
    level() {
      let peak = 0;
      for (const [media, node] of nodes) {
        if (media.paused) continue;
        node.analyser.getByteTimeDomainData(samples);
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128) / 128);
      }
      return peak;
    },
    dispose() { for (const node of nodes.values()) { node.source.disconnect(); node.gain.disconnect(); } nodes.clear(); void context?.close(); context = null; }
  };
}

