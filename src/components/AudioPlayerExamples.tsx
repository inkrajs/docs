import { useState } from 'react';
import { AudioPlayer, Button, PencilText, Switch } from '@inkra/react';
import type { AudioPlayerState } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './AudioPlayerExamples.css';

function makeSampleAudio() {
  const sampleRate = 8000;
  const seconds = 12;
  const sampleCount = sampleRate * seconds;
  const bytes = new Uint8Array(44 + sampleCount);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => value.split('').forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, 'data');
  view.setUint32(40, sampleCount, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.min(1, index / sampleRate) * Math.min(1, (sampleCount - index) / sampleRate);
    bytes[44 + index] = 128 + Math.round(Math.sin(index / sampleRate * Math.PI * 440) * 12 * envelope);
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    encoded += alphabet[a >> 2];
    encoded += alphabet[((a & 3) << 4) | (b >> 4)];
    encoded += index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=';
    encoded += index + 2 < bytes.length ? alphabet[c & 63] : '=';
  }
  return `data:audio/wav;base64,${encoded}`;
}

const sampleAudio = makeSampleAudio();

export function AudioPlayerExamples() {
  const { locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'en' ? en : zh;
  const [autoPlay, setAutoPlay] = useState(false);
  const [state, setState] = useState<AudioPlayerState | null>(null);
  const [custom, setCustom] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const labels = {
    audio: text('示例音频', 'Sample audio'), controls: text('音频控制', 'Audio controls'),
    play: text('播放', 'Play'), pause: text('暂停', 'Pause'), seek: text('进度', 'Seek'),
    volume: text('音量', 'Volume'), mute: text('静音', 'Mute'), unmute: text('取消静音', 'Unmute'),
    rate: text('倍速', 'Speed'), loading: text('正在加载音频', 'Loading audio'),
    blocked: text('播放被阻止，请再次点击播放。', 'Playback was blocked. Press play to try again.'),
    error: text('音频加载失败。', 'Audio failed to load.'),
  };
  const statuses: Record<AudioPlayerState['status'], string> = {
    idle: text('未加载', 'Idle'), loading: text('加载中', 'Loading'), ready: text('就绪', 'Ready'),
    playing: text('播放中', 'Playing'), paused: text('已暂停', 'Paused'), buffering: text('缓冲中', 'Buffering'),
    ended: text('播放结束', 'Ended'), blocked: text('播放被阻止', 'Playback blocked'), error: text('加载失败', 'Load failed'),
  };
  const code = `<AudioPlayer
  src={sampleAudio}
  autoPlay={${autoPlay}}
  labels={localizedLabels}
  ${custom ? 'renderControls={controls => <YourControls {...controls} />}' : ''}
/>`;
  const status = state ? text(`状态：${statuses[state.status]}`, `Status: ${statuses[state.status]}`) : text('等待播放', 'Ready to play');

  return <div className="audio-player-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('基础', 'Basics'), content: <Switch label={text('自动播放', 'Autoplay')} checked={autoPlay} onCheckedChange={setAutoPlay} /> },
      { label: text('组合', 'Composition'), content: <Switch label={text('自定义控制区', 'Custom controls')} checked={custom} onCheckedChange={setCustom} /> },
    ]} />}>
      <div className="audio-player-examples__stage" data-testid="audio-player-playground">
        <AudioPlayer src={sampleAudio} autoPlay={autoPlay} labels={labels} renderControls={custom ? controls => <div className="audio-player-examples__custom-controls"><Button variant="outline" onClick={() => void controls.togglePlay()}>{controls.state.status === 'playing' ? text('暂停', 'Pause') : text('播放', 'Play')}</Button><Button variant="ghost" onClick={() => controls.seek(0)}>{text('回到开头', 'Restart')}</Button></div> : undefined} />
      </div>
    </ComponentPlayground>

    <ComponentExample id="audio-player-controlled-volume-and-speed" title={text('受控音量与倍速', 'Controlled volume and speed')} code={`<AudioPlayer
  src={sampleAudio}
  volume={volume}
  muted={muted}
  playbackRate={playbackRate}
  onVolumeChange={setVolume}
  onMutedChange={setMuted}
  onPlaybackRateChange={setPlaybackRate}
  labels={localizedLabels}
/>`}>
      <div className="audio-player-examples__secondary" data-testid="audio-player-controlled">
        <AudioPlayer src={sampleAudio} preload="none" volume={volume} muted={muted} playbackRate={playbackRate}
          onVolumeChange={setVolume} onMutedChange={setMuted} onPlaybackRateChange={setPlaybackRate} onStateChange={setState} labels={labels} />
        <Button variant="outline" onClick={() => { setVolume(0.5); setMuted(false); setPlaybackRate(1); }}>{text('重置播放设置', 'Reset playback settings')}</Button>
        <PencilText as="p" className="audio-player-examples__status">{text(`音量 ${Math.round(volume * 100)}% · ${muted ? '已静音' : '未静音'} · ${playbackRate} 倍速`, `Volume ${Math.round(volume * 100)}% · ${muted ? 'Muted' : 'Unmuted'} · ${playbackRate}x`)}</PencilText>
        <PencilText as="p" className="audio-player-examples__status" aria-live="polite">{status}</PencilText>
      </div>
    </ComponentExample>
  </div>;
}
