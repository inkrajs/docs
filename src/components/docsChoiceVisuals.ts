import { __iconData as arrowDown } from 'lucide-react/dist/esm/icons/arrow-down.mjs';
import { __iconData as arrowUp } from 'lucide-react/dist/esm/icons/arrow-up.mjs';
import { __iconData as arrowLeft } from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import { __iconData as arrowRight } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as moveVertical } from 'lucide-react/dist/esm/icons/move-vertical.mjs';
import { __iconData as moveHorizontal } from 'lucide-react/dist/esm/icons/move-horizontal.mjs';
import { __iconData as move } from 'lucide-react/dist/esm/icons/move.mjs';
import { __iconData as textStart } from 'lucide-react/dist/esm/icons/text-align-start.mjs';
import { __iconData as textCenter } from 'lucide-react/dist/esm/icons/text-align-center.mjs';
import { __iconData as textEnd } from 'lucide-react/dist/esm/icons/text-align-end.mjs';
import { __iconData as alignStart } from 'lucide-react/dist/esm/icons/align-horizontal-justify-start.mjs';
import { __iconData as alignCenter } from 'lucide-react/dist/esm/icons/align-horizontal-justify-center.mjs';
import { __iconData as alignEnd } from 'lucide-react/dist/esm/icons/align-horizontal-justify-end.mjs';
import { __iconData as alignBetween } from 'lucide-react/dist/esm/icons/align-horizontal-space-between.mjs';
import { __iconData as alignTop } from 'lucide-react/dist/esm/icons/align-vertical-justify-start.mjs';
import { __iconData as alignMiddle } from 'lucide-react/dist/esm/icons/align-vertical-justify-center.mjs';
import { __iconData as alignBottom } from 'lucide-react/dist/esm/icons/align-vertical-justify-end.mjs';
import { __iconData as alignVerticalBetween } from 'lucide-react/dist/esm/icons/align-vertical-space-between.mjs';
import { __iconData as columns } from 'lucide-react/dist/esm/icons/columns-2.mjs';
import { __iconData as rows } from 'lucide-react/dist/esm/icons/rows-2.mjs';
import { __iconData as rowsDense } from 'lucide-react/dist/esm/icons/rows-4.mjs';
import { __iconData as square } from 'lucide-react/dist/esm/icons/square.mjs';
import { __iconData as squareCheck } from 'lucide-react/dist/esm/icons/square-check.mjs';
import { __iconData as listChecks } from 'lucide-react/dist/esm/icons/list-checks.mjs';
import { __iconData as list } from 'lucide-react/dist/esm/icons/list.mjs';
import { __iconData as grid } from 'lucide-react/dist/esm/icons/grid-2x2.mjs';
import { __iconData as kanban } from 'lucide-react/dist/esm/icons/columns-3.mjs';
import { __iconData as sliders } from 'lucide-react/dist/esm/icons/sliders-horizontal.mjs';
import { __iconData as info } from 'lucide-react/dist/esm/icons/info.mjs';
import { __iconData as check } from 'lucide-react/dist/esm/icons/circle-check.mjs';
import { __iconData as warning } from 'lucide-react/dist/esm/icons/triangle-alert.mjs';
import { __iconData as error } from 'lucide-react/dist/esm/icons/circle-x.mjs';
import { __iconData as loader } from 'lucide-react/dist/esm/icons/loader-circle.mjs';
import { __iconData as eyeOff } from 'lucide-react/dist/esm/icons/eye-off.mjs';
import { __iconData as pointer } from 'lucide-react/dist/esm/icons/mouse-pointer-click.mjs';
import { __iconData as hand } from 'lucide-react/dist/esm/icons/hand.mjs';
import { __iconData as layers } from 'lucide-react/dist/esm/icons/layers-2.mjs';
import { __iconData as scan } from 'lucide-react/dist/esm/icons/scan.mjs';
import { __iconData as maximize } from 'lucide-react/dist/esm/icons/maximize.mjs';
import { __iconData as textCursor } from 'lucide-react/dist/esm/icons/text-cursor-input.mjs';
import { __iconData as chevronDown } from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import { __iconData as search } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as searchText } from 'lucide-react/dist/esm/icons/text-search.mjs';
import { __iconData as chevrons } from 'lucide-react/dist/esm/icons/chevrons-left-right.mjs';
import { __iconData as sun } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as heading2 } from 'lucide-react/dist/esm/icons/heading-2.mjs';
import { __iconData as heading3 } from 'lucide-react/dist/esm/icons/heading-3.mjs';
import { __iconData as heading4 } from 'lucide-react/dist/esm/icons/heading-4.mjs';
import { __iconData as pilcrowLeft } from 'lucide-react/dist/esm/icons/pilcrow-left.mjs';
import { __iconData as pilcrowRight } from 'lucide-react/dist/esm/icons/pilcrow-right.mjs';
import { __iconData as chartLine } from 'lucide-react/dist/esm/icons/chart-line.mjs';
import { __iconData as chartBar } from 'lucide-react/dist/esm/icons/chart-column.mjs';
import { __iconData as calendar } from 'lucide-react/dist/esm/icons/calendar-days.mjs';
import { __iconData as calendarRange } from 'lucide-react/dist/esm/icons/calendar-range.mjs';
import { __iconData as folder } from 'lucide-react/dist/esm/icons/folder.mjs';
import { __iconData as chevronRight } from 'lucide-react/dist/esm/icons/chevron-right.mjs';
import { __iconData as crop } from 'lucide-react/dist/esm/icons/crop.mjs';
import { __iconData as rectangle } from 'lucide-react/dist/esm/icons/rectangle-vertical.mjs';
import type { LucideIconData } from './DocsIcon';

export type DocsChoiceVisual = { icon: LucideIconData; size?: number; logical?: boolean; labelOptional?: boolean };
export type DocsChoiceVisuals = Readonly<Record<string, DocsChoiceVisual>>;

const icon = (data: LucideIconData): DocsChoiceVisual => ({ icon: data });
const symbol = (data: LucideIconData): DocsChoiceVisual => ({ icon: data, labelOptional: true });
const logical = (data: LucideIconData): DocsChoiceVisual => ({ ...symbol(data), logical: true });

export const choiceVisuals = {
  loadDirection: { bottom: symbol(arrowDown), vertical: symbol(moveVertical), all: symbol(move) },
  loadInteraction: { automatic: icon(loader), release: icon(hand), both: icon(layers) },
  textAlignment: { start: logical(textStart), center: symbol(textCenter), end: logical(textEnd) },
  horizontalAlignment: { start: logical(alignStart), center: symbol(alignCenter), end: logical(alignEnd), between: symbol(alignBetween) },
  verticalAlignment: { start: symbol(alignTop), center: symbol(alignMiddle), end: symbol(alignBottom), between: symbol(alignVerticalBetween) },
  cellAlignment: { top: symbol(alignTop), middle: symbol(alignMiddle), bottom: symbol(alignBottom) },
  orientation: { horizontal: symbol(columns), vertical: symbol(rows) },
  scrollAxis: { horizontal: symbol(moveHorizontal), vertical: symbol(moveVertical), both: symbol(move) },
  direction: { top: symbol(arrowUp), bottom: symbol(arrowDown), left: symbol(arrowLeft), right: symbol(arrowRight) },
  size: { xs: { icon: square, size: 10 }, sm: { icon: square, size: 14 }, md: { icon: square, size: 20 }, lg: { icon: square, size: 26 } },
  selection: { none: icon(eyeOff), single: icon(squareCheck), multiple: icon(listChecks) },
  status: { info: icon(info), success: icon(check), warning: icon(warning), danger: icon(error) },
  loadingStatus: { loading: icon(loader), error: icon(error), complete: icon(check) },
  loadingMode: { inline: icon(textCursor), region: icon(scan), fullscreen: icon(maximize) },
  loadingProgress: { determinate: icon(chartBar), indeterminate: icon(loader), none: icon(eyeOff) },
  gridMode: { board: icon(kanban), tracks: icon(sliders), basic: icon(grid) },
} satisfies Record<string, DocsChoiceVisuals>;

// Match complete value families, never translated labels or individual ambiguous keys.
// Call sites supply an explicit family when the same keys describe a different axis.
const families: readonly DocsChoiceVisuals[] = [
  choiceVisuals.loadDirection,
  choiceVisuals.loadInteraction,
  choiceVisuals.textAlignment,
  choiceVisuals.horizontalAlignment,
  choiceVisuals.orientation,
  choiceVisuals.scrollAxis,
  choiceVisuals.direction,
  choiceVisuals.cellAlignment,
  choiceVisuals.size,
  choiceVisuals.selection,
  choiceVisuals.status,
  choiceVisuals.loadingStatus,
  choiceVisuals.loadingMode,
  choiceVisuals.loadingProgress,
  choiceVisuals.gridMode,
  { ltr: icon(pilcrowRight), rtl: icon(pilcrowLeft) },
  { single: icon(calendar), range: icon(calendarRange) },
  { list: symbol(list), grid: symbol(grid) },
  { line: icon(chartLine), bar: icon(chartBar) },
  { linear: icon(moveHorizontal), circular: icon(loader) },
  { light: icon(sun), dark: icon(moon) },
  { h2: icon(heading2), h3: icon(heading3), h4: icon(heading4) },
  { compact: icon(rowsDense), comfortable: icon(rows), roomy: icon(rows) },
  { folder: icon(folder), chevron: icon(chevronRight) },
  { dropdown: icon(chevronDown), 'search-trigger': icon(searchText), 'search-popup': icon(search), searchable: icon(search), stepper: icon(chevrons) },
  { input: icon(textCursor), textarea: icon(textStart), select: icon(chevronDown) },
  { automatic: icon(loader), manual: icon(pointer) },
  { square: icon(square), portrait: icon(rectangle), free: icon(crop) },
  { cover: icon(crop), contain: icon(scan) },
  { row: logical(arrowRight), column: symbol(arrowDown), 'row-reverse': logical(arrowLeft), 'column-reverse': symbol(arrowUp) },
];

export function resolveChoiceVisuals(options: readonly (readonly [string, string])[]): DocsChoiceVisuals | undefined {
  if (options.length < 2) return undefined;
  return families.find(family => options.every(([key]) => Object.hasOwn(family, key)));
}
