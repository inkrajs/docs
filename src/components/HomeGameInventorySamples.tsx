import { useRef, useState } from 'react';
import { Badge, Button, InventoryGrid, Progress, type InventoryContainer, type InventoryItem } from '@inkra/react';
import { __iconData as swordIcon } from 'lucide-react/dist/esm/icons/sword.mjs';
import { __iconData as potionIcon } from 'lucide-react/dist/esm/icons/milk.mjs';
import { __iconData as gemIcon } from 'lucide-react/dist/esm/icons/gem.mjs';
import { __iconData as scrollIcon } from 'lucide-react/dist/esm/icons/scroll-text.mjs';
import { __iconData as bowIcon } from 'lucide-react/dist/esm/icons/bow-arrow.mjs';
import { __iconData as wandIcon } from 'lucide-react/dist/esm/icons/wand-sparkles.mjs';
import { __iconData as heartIcon } from 'lucide-react/dist/esm/icons/heart.mjs';
import { useLocale } from '../i18n';
import { DeferredPencilText as PencilText, DeferredDocsIcon as DocsIcon } from './HomeDemo';
import './HomeGameInventorySamples.css';

function useGameText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => locale === 'en' ? en : zh;
}

function animateFeedback(element: HTMLElement | null, keyframes: Keyframe[], duration = 520) {
  if (!element?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate(keyframes, { duration, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' });
}

type LootKind = 'sword' | 'potion' | 'gem' | 'scroll';
interface LootItem extends InventoryItem { kind: LootKind }
const lootIcons = { sword: swordIcon, potion: potionIcon, gem: gemIcon, scroll: scrollIcon };
const newBackpack = (): readonly InventoryContainer<LootItem>[] => [{
  id: 'hero-pack', columns: 5, rows: 3, items: [
    { id: 'sword', kind: 'sword', position: { x: 0, y: 0 }, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }] },
    { id: 'potion', kind: 'potion', position: { x: 2, y: 0 }, cells: [{ x: 0, y: 0 }], rotatable: false },
    { id: 'gem', kind: 'gem', position: { x: 4, y: 0 }, cells: [{ x: 0, y: 0 }], rotatable: false },
    { id: 'scroll', kind: 'scroll', position: { x: 2, y: 2 }, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  ],
}];

export function HomeInventorySample() {
  const text = useGameText();
  const [containers, setContainers] = useState(newBackpack);
  const [potions, setPotions] = useState(2);
  const [health, setHealth] = useState(58);
  const [recovered, setRecovered] = useState(0);
  const heart = useRef<HTMLSpanElement>(null);
  const recovery = useRef<HTMLSpanElement>(null);
  const names: Record<LootKind, string> = {
    sword: text('旅人短剑', 'Traveler’s sword'), potion: text('回复药水', 'Healing potion'),
    gem: text('湖蓝晶石', 'Lake crystal'), scroll: text('旧地图卷轴', 'Old map scroll'),
  };
  const drink = () => {
    if (!potions || health >= 100) return;
    setRecovered(Math.min(25, 100 - health));
    setHealth(current => Math.min(100, current + 25));
    animateFeedback(heart.current, [{ transform: 'scale(1)' }, { transform: 'scale(1.2)', offset: 0.35 }, { transform: 'scale(1)' }]);
    animateFeedback(recovery.current, [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(-4px)', offset: 0.25 }, { opacity: 1, transform: 'translateY(-10px)', offset: 0.65 }, { opacity: 0, transform: 'translateY(-18px)' }], 800);
    setPotions(current => current - 1);
    if (potions === 1) setContainers(current => current.map(container => ({
      ...container, items: container.items.filter(item => item.kind !== 'potion'),
    })));
  };
  const reset = () => {
    heart.current?.getAnimations().forEach(animation => animation.cancel());
    recovery.current?.getAnimations().forEach(animation => animation.cancel());
    setContainers(newBackpack()); setPotions(2); setHealth(58); setRecovered(0);
  };
  return <div className="home-game-inventory">
    <div className="home-game-inventory__heading">
      <PencilText as="h2">{text('冒险家的小背包', 'An adventurer’s backpack')}</PencilText>
      <Badge size="sm">{text('可拖动', 'Drag to pack')}</Badge>
    </div>
    <div className="home-game-inventory__health">
      <span ref={heart} className="home-game-inventory__heart"><DocsIcon data={heartIcon} size={22} /></span>
      <span ref={recovery} className="home-game-inventory__recovery" aria-hidden="true"><PencilText>{`+${recovered}`}</PencilText></span>
      <Progress value={health} label={text('生命值', 'Health')} size="sm"><PencilText>{`${health} / 100`}</PencilText></Progress>
    </div>
    <InventoryGrid className="home-game-inventory__board" containers={containers.map(container => ({ ...container, label: text('随身物品', 'Items on hand') }))} onChange={setContainers}
      cellSize={44} allowRotation aria-label={text('冒险物品背包', 'Adventure inventory')}
      getItemLabel={item => item.kind === 'potion' ? `${names.potion} × ${potions}` : names[item.kind]}
      labels={{ rotate: text('旋转物品', 'Rotate item'), instructions: text(
        '拖动物品整理背包；键盘按空格拿起，方向键移动，R 旋转，再按空格放下。',
        'Drag to pack. With the keyboard, press Space to pick up, arrows to move, R to rotate, and Space to drop.',
      ) }}
      renderItem={item => <span className={`home-game-inventory__loot home-game-inventory__loot--${item.kind}`}>
        <DocsIcon data={lootIcons[item.kind]} size={26} />
        {item.kind === 'potion' && <PencilText className="home-game-inventory__quantity">{String(potions)}</PencilText>}
      </span>} />
    <div className="home-game-inventory__actions">
      <Button variant="outline" startIcon={<DocsIcon data={potionIcon} />} onClick={drink} disabled={!potions || health >= 100}>
        {text(`喝药水（${potions}）`, `Drink potion (${potions})`)}
      </Button>
      <Button variant="ghost" onClick={reset}>{text('重新出发', 'Start over')}</Button>
    </div>
    <PencilText as="p" className="home-game-inventory__note" aria-live="polite">{health === 100
      ? text('生命值回满了，背包也腾出了一个位置。', 'Fully healed, with a little more room in the bag.')
      : text('拖一拖、转一转。药水每瓶回复 25 点生命。', 'Move things around. Each potion restores 25 health.')}</PencilText>
  </div>;
}

const weapons = [
  { id: 'sword', icon: swordIcon, zh: '短剑', en: 'Sword', attack: 18, guard: 8, agility: 6,
    descriptionZh: '不花哨，但很可靠。林间近战的好伙伴。', descriptionEn: 'Simple and dependable. A good companion in close quarters.' },
  { id: 'bow', icon: bowIcon, zh: '猎弓', en: 'Bow', attack: 24, guard: 2, agility: 12,
    descriptionZh: '把距离变成优势，也给脚步多一点轻快。', descriptionEn: 'Keep your distance and travel a little lighter.' },
  { id: 'wand', icon: wandIcon, zh: '星木杖', en: 'Wand', attack: 32, guard: 5, agility: 3,
    descriptionZh: '星木里藏着一点魔法，适合慢慢蓄力。', descriptionEn: 'A little magic in the wood, for a patient spellcaster.' },
] as const;

export function HomeEquipmentSample() {
  const text = useGameText();
  const [preview, setPreview] = useState(1);
  const [equipped, setEquipped] = useState(0);
  const previewPanel = useRef<HTMLDivElement>(null);
  const equipNotice = useRef<HTMLDivElement>(null);
  const choose = (index: number) => {
    if (index === preview) return;
    setPreview(index);
    animateFeedback(previewPanel.current, [{ opacity: 0.45, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], 500);
  };
  const equip = () => {
    if (preview === equipped) return;
    setEquipped(preview);
    animateFeedback(equipNotice.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)', offset: 0.35 }, { transform: 'translateY(0)' }], 520);
  };
  const weapon = weapons[preview];
  const current = weapons[equipped];
  const stats = [
    { key: 'attack', label: text('攻击', 'Attack') },
    { key: 'guard', label: text('防御', 'Guard') },
    { key: 'agility', label: text('敏捷', 'Agility') },
  ] as const;
  return <div className="home-game-equipment">
    <PencilText as="h2">{text('出发前，换件装备', 'Choose your equipment')}</PencilText>
    <div className="home-game-equipment__choices" role="group" aria-label={text('预览武器', 'Preview a weapon')}>
      {weapons.map((item, index) => <Button key={item.id} variant={preview === index ? 'secondary' : 'ghost'}
        size="sm" aria-pressed={preview === index} startIcon={<DocsIcon data={item.icon} size={22} />}
        onClick={() => choose(index)}>{text(item.zh, item.en)}</Button>)}
    </div>
    <div ref={previewPanel} className="home-game-equipment__preview">
      <div className="home-game-equipment__illustration"><DocsIcon data={weapon.icon} size={64} /></div>
      <PencilText as="h3">{text(weapon.zh, weapon.en)}</PencilText>
      <PencilText as="p" className="home-game-inventory__note">{text(weapon.descriptionZh, weapon.descriptionEn)}</PencilText>
    </div>
    <dl className="home-game-equipment__stats">
      {stats.map(stat => {
        const delta = weapon[stat.key] - current[stat.key];
        return <div key={stat.key}>
          <dt><PencilText>{stat.label}</PencilText></dt>
          <dd><PencilText>{String(weapon[stat.key])}</PencilText>
            <PencilText className="home-game-equipment__delta" data-direction={delta > 0 ? 'up' : delta < 0 ? 'down' : 'same'}>
              {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta}`}
            </PencilText>
          </dd>
        </div>;
      })}
    </dl>
    <div ref={equipNotice} className="home-game-equipment__equip">
      <PencilText className="home-game-inventory__note" aria-live="polite">{text(`已装备：${current.zh}`, `Equipped: ${current.en}`)}</PencilText>
      <Button variant="outline" disabled={preview === equipped} onClick={equip}>
        {preview === equipped ? text('已装备', 'Equipped') : text('换上这件', 'Equip this')}
      </Button>
    </div>
  </div>;
}
