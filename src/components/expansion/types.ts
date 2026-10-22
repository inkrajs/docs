import type { ComponentType } from 'react';

export interface ExpansionDoc {
  name: string;
  intro: { zh: string; en: string };
  api: ([string, string] | [string, string, string, string])[];
  a11y: { zh: string; en: string };
  Examples: ComponentType;
}
