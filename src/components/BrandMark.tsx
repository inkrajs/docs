import { PencilIcon, type PencilIconPath } from '@inkra/react';

const paths: readonly PencilIconPath[] = [
  { d: 'M10 30L13 22L27 8L32 13L18 27Z' },
  { d: 'M10 33Q16 30 22 32Q27 34 31 31' },
];

export function BrandMark({ size = 32 }: { size?: number }) {
  return <PencilIcon className="brand-mark" paths={paths} seed="inkra-brand-pencil-minimal" size={size} sourceSize={40} />;
}
