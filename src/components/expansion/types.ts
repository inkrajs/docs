import type { ComponentType } from 'react';
import type { ApiGroup, ApiRow } from '../apiGroupRows';

export interface ExpansionDoc {
  name: string;
  intro: { zh: string; en: string };
  api?: readonly ApiRow[];
  apiGroups?: readonly ApiGroup[];
  a11y: { zh: string; en: string };
  Examples: ComponentType;
}
