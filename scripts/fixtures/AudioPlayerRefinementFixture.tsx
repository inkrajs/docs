import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioPlayer, Button, type AudioPlayerControls, type AudioPlayerState } from '@inkra/react';

function makeWav(seconds: number, frequency: number) {
  const sampleRate = 8000;
  const sampleCount = sampleRate * seconds;
  const bytes = new Uint8Array(44 + sampleCount);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => value.split('').forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, 36 + sampleCount, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  write(36, 'data'); view.setUint32(40, sampleCount, true);
  for (let index = 0; index < sampleCount; index += 1) bytes[44 + index] = 128 + Math.round(Math.sin(index / sampleRate * Math.PI * 2 * frequency) * 8);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const sourceA = makeWav(1, 220);
const sourceB = makeWav(2, 330);

type Events = {
  loadStarts: number;
  inlineStates: string[];
  controlledVolumes: number[];
  controlledMuted: boolean[];
  controlledRates: number[];
  uncontrolledVolumes: number[];
  uncontrolledMuted: boolean[];
  uncontrolledRates: number[];
};

const localizedLabels = {
  controls: 'Localized audio controls', audio: 'Localized native audio', play: 'Play fixture audio', pause: 'Pause fixture audio',
  mute: 'Mute fixture audio', unmute: 'Unmute fixture audio', seek: 'Fixture seek', volume: 'Fixture volume', rate: 'Fixture speed',
};

function Fixture({ events }: { events: Events }) {
  const [inlineTick, setInlineTick] = useState(0);
  const [inlineState, setInlineState] = useState<AudioPlayerState | null>(null);
  const [lifecycleSource, setLifecycleSource] = useState<string | undefined>(sourceA);
  const [lifecycleState, setLifecycleState] = useState<AudioPlayerState | null>(null);
  const [unrelatedTick, setUnrelatedTick] = useState(0);
  const lifecycleRef = useRef<AudioPlayerControls>(null);

  return <main style={{ display: 'grid', gap: 24, maxWidth: 900, padding: 24 }}>
    <section data-testid="inline-callback-case">
      <Button onClick={() => setInlineTick(value => value + 1)}>Rerender inline callback {inlineTick}</Button>
      <AudioPlayer src={sourceA} labels={localizedLabels}
        audioProps={{ onLoadStart: () => { events.loadStarts += 1; } }}
        onStateChange={next => { events.inlineStates.push(next.status); setInlineState(next); }} />
      <output data-testid="inline-status">{inlineState?.status ?? 'none'}</output>
    </section>

    <section data-testid="controlled-case">
      <AudioPlayer src={sourceA} labels={{ ...localizedLabels, controls: 'Controlled audio controls', audio: 'Controlled native audio' }}
        volume={0.4} muted={false} playbackRate={1}
        onVolumeChange={value => events.controlledVolumes.push(value)}
        onMutedChange={value => events.controlledMuted.push(value)}
        onPlaybackRateChange={value => events.controlledRates.push(value)} />
    </section>

    <section data-testid="uncontrolled-case">
      <Button onClick={() => setUnrelatedTick(value => value + 1)}>Rerender uncontrolled {unrelatedTick}</Button>
      <AudioPlayer src={sourceA} labels={{ ...localizedLabels, controls: 'Uncontrolled audio controls', audio: 'Explicit ignored audio label' }}
        audioProps={{ 'aria-label': 'Explicit native audio name' }}
        defaultVolume={0.3} defaultMuted={false} defaultPlaybackRate={1.25}
        onVolumeChange={value => events.uncontrolledVolumes.push(value)}
        onMutedChange={value => events.uncontrolledMuted.push(value)}
        onPlaybackRateChange={value => events.uncontrolledRates.push(value)} />
    </section>

    <section data-testid="lifecycle-case">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button onClick={() => lifecycleRef.current?.setVolume(0.35)}>Set lifecycle volume</Button>
        <Button onClick={() => lifecycleRef.current?.setMuted(true)}>Set lifecycle mute</Button>
        <Button onClick={() => lifecycleRef.current?.setPlaybackRate(1.5)}>Set lifecycle rate</Button>
        <Button onClick={() => setLifecycleSource(undefined)}>Clear lifecycle source</Button>
        <Button onClick={() => setLifecycleSource(sourceB)}>Change lifecycle source</Button>
      </div>
      <AudioPlayer ref={lifecycleRef} src={lifecycleSource} labels={{ ...localizedLabels, controls: 'Lifecycle audio controls', audio: 'Lifecycle native audio' }}
        onStateChange={setLifecycleState} />
      <output data-testid="lifecycle-status">{lifecycleState?.status ?? 'none'}</output>
    </section>

    <section data-testid="narrow-case" style={{ inlineSize: 232, maxInlineSize: '100%', minInlineSize: 0 }}>
      <AudioPlayer src={sourceB} labels={{ ...localizedLabels, controls: 'Narrow audio controls', audio: 'Narrow native audio',
        time: (current, duration) => `Elapsed ${current.toFixed(2)} seconds from a deliberately long total duration label ${duration.toFixed(2)} seconds` }} />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = {
    loadStarts: 0, inlineStates: [], controlledVolumes: [], controlledMuted: [], controlledRates: [],
    uncontrolledVolumes: [], uncontrolledMuted: [], uncontrolledRates: [],
  };
  root.render(<Fixture events={events} />);
  return { events, sourceA, sourceB, unmount: () => root.unmount() };
}
