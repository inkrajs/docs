export type PreviewResourceStatus = 'ready' | 'failed' | 'timed-out' | 'aborted' | 'skipped';

interface StylesheetLike {
  sheet: unknown | null;
  addEventListener(type: 'load' | 'error', listener: EventListener, options?: AddEventListenerOptions): void;
  removeEventListener(type: 'load' | 'error', listener: EventListener): void;
}

interface FontSetLike {
  load(font: string): Promise<unknown>;
  ready: Promise<unknown>;
  check(font: string): boolean;
}

export interface PreviewReadinessOptions {
  links: readonly StylesheetLike[];
  fonts?: FontSetLike;
  font?: string;
  timeoutMs?: number;
  frameTimeoutMs?: number;
  signal: AbortSignal;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
}

export interface PreviewReadinessResult {
  styles: PreviewResourceStatus;
  fonts: PreviewResourceStatus;
  frames: PreviewResourceStatus;
}

function waitForStylesheet(link: StylesheetLike, signal: AbortSignal): Promise<'ready' | 'failed' | 'aborted'> {
  if (link.sheet) return Promise.resolve('ready');
  if (signal.aborted) return Promise.resolve('aborted');
  return new Promise(resolve => {
    const finish = (status: 'ready' | 'failed' | 'aborted') => {
      link.removeEventListener('load', onLoad);
      link.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
      resolve(status);
    };
    const onLoad = () => finish('ready');
    const onError = () => finish('failed');
    const onAbort = () => finish('aborted');
    try {
      link.addEventListener('load', onLoad, { once: true });
      link.addEventListener('error', onError, { once: true });
      signal.addEventListener('abort', onAbort, { once: true });
    } catch {
      finish('failed');
    }
  });
}

async function waitWithDeadline(
  task: (signal: AbortSignal) => Promise<PreviewResourceStatus>,
  timeoutMs: number,
  parentSignal: AbortSignal,
): Promise<PreviewResourceStatus> {
  if (parentSignal.aborted) return 'aborted';
  return new Promise(resolve => {
    const controller = new AbortController();
    let settled = false;
    let timer = 0;
    const finish = (status: PreviewResourceStatus) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      parentSignal.removeEventListener('abort', onAbort);
      controller.abort();
      resolve(status);
    };
    const onAbort = () => finish('aborted');
    parentSignal.addEventListener('abort', onAbort, { once: true });
    timer = globalThis.setTimeout(() => finish('timed-out'), timeoutMs);
    try {
      task(controller.signal).then(finish, () => finish(controller.signal.aborted ? 'aborted' : 'failed'));
    } catch {
      finish(controller.signal.aborted ? 'aborted' : 'failed');
    }
  });
}

function combineStatuses(statuses: readonly PreviewResourceStatus[]): PreviewResourceStatus {
  if (!statuses.length) return 'ready';
  if (statuses.includes('aborted')) return 'aborted';
  if (statuses.includes('timed-out')) return 'timed-out';
  if (statuses.includes('failed')) return 'failed';
  return 'ready';
}

function waitForPromise(promise: Promise<unknown>, signal: AbortSignal): Promise<'ready' | 'failed' | 'aborted'> {
  if (signal.aborted) return Promise.resolve('aborted');
  return new Promise(resolve => {
    let settled = false;
    const finish = (status: 'ready' | 'failed' | 'aborted') => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      resolve(status);
    };
    const onAbort = () => finish('aborted');
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(() => finish('ready'), () => finish('failed'));
  });
}

async function waitForFont(fonts: FontSetLike, font: string, signal: AbortSignal): Promise<PreviewResourceStatus> {
  if (signal.aborted) return 'aborted';
  const loaded = await new Promise<{ status: 'ready' | 'failed' | 'aborted'; faces?: unknown }>(resolve => {
    let settled = false;
    const finish = (status: 'ready' | 'failed' | 'aborted', faces?: unknown) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      resolve({ status, faces });
    };
    const onAbort = () => finish('aborted');
    signal.addEventListener('abort', onAbort, { once: true });
    try {
      fonts.load(font).then(faces => finish('ready', faces), () => finish('failed'));
    } catch {
      finish('failed');
    }
  });
  if (loaded.status !== 'ready') return loaded.status;
  const faces = loaded.faces;
  if (!Array.isArray(faces) || faces.length === 0) return 'failed';
  const ready = await waitForPromise(fonts.ready, signal);
  if (ready !== 'ready') return ready;
  try { return fonts.check(font) ? 'ready' : 'failed'; } catch { return 'failed'; }
}

function waitForFrames(
  requestFrame: (callback: FrameRequestCallback) => number,
  cancelFrame: (handle: number) => void,
  signal: AbortSignal,
): Promise<'ready' | 'aborted'> {
  if (signal.aborted) return Promise.resolve('aborted');
  return new Promise(resolve => {
    let first = 0;
    let second = 0;
    const finish = (status: 'ready' | 'aborted') => {
      if (first) cancelFrame(first);
      if (second) cancelFrame(second);
      signal.removeEventListener('abort', onAbort);
      resolve(status);
    };
    const onAbort = () => finish('aborted');
    signal.addEventListener('abort', onAbort, { once: true });
    first = requestFrame(() => {
      first = 0;
      second = requestFrame(() => {
        second = 0;
        finish('ready');
      });
    });
  });
}

export async function waitForPreviewReadiness({
  links,
  fonts,
  font = '15px "Inkra Xiaolai"',
  timeoutMs = 600,
  frameTimeoutMs = 200,
  signal,
  requestFrame,
  cancelFrame,
}: PreviewReadinessOptions): Promise<PreviewReadinessResult> {
  const startedAt = performance.now();
  const remaining = () => Math.max(0, timeoutMs - (performance.now() - startedAt));
  const styles = await waitWithDeadline(async childSignal => combineStatuses(await Promise.all(
    links.map(link => waitForStylesheet(link, childSignal)),
  )), remaining(), signal);
  let fontStatus: PreviewResourceStatus = 'skipped';
  if (fonts) {
    if (styles === 'ready') {
      const budget = remaining();
      fontStatus = budget > 0
        ? await waitWithDeadline(childSignal => waitForFont(fonts, font, childSignal), budget, signal)
        : 'timed-out';
    } else if (signal.aborted || styles === 'aborted') {
      fontStatus = 'aborted';
    }
  }

  const frameBudget = Math.min(frameTimeoutMs, remaining());
  const frames = requestFrame && cancelFrame
    ? frameBudget > 0
      ? await waitWithDeadline(childSignal => waitForFrames(requestFrame, cancelFrame, childSignal), frameBudget, signal)
      : 'timed-out'
    : 'skipped';
  return { styles, fonts: fontStatus, frames };
}
