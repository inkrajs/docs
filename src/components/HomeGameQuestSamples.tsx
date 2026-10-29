import { useRef, useState } from 'react';
import { Badge, Button, Checkbox, NumberTicker, Progress } from '@inkra/react';
import { __iconData as coinsIcon } from 'lucide-react/dist/esm/icons/coins.mjs';
import { __iconData as scrollIcon } from 'lucide-react/dist/esm/icons/scroll-text.mjs';
import { __iconData as flaskIcon } from 'lucide-react/dist/esm/icons/flask-conical.mjs';
import { __iconData as leafIcon } from 'lucide-react/dist/esm/icons/leaf.mjs';
import { __iconData as waterIcon } from 'lucide-react/dist/esm/icons/droplets.mjs';
import { __iconData as crystalIcon } from 'lucide-react/dist/esm/icons/sparkles.mjs';
import { useLocale } from '../i18n';
import { DeferredPencilText as PencilText, DeferredDocsIcon as DocsIcon } from './HomeDemo';
import './HomeGameQuestSamples.css';

function useGameText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => locale === 'en' ? en : zh;
}

function animateFeedback(element: HTMLElement | null, keyframes: Keyframe[], duration = 520) {
  if (!element?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate(keyframes, { duration, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' });
}

export function HomeQuestSample() {
  const text = useGameText();
  const [done, setDone] = useState([false, false, false]);
  const [claimed, setClaimed] = useState(false);
  const coins = useRef<HTMLSpanElement>(null);
  const complete = done.filter(Boolean).length;
  const claim = () => {
    if (claimed || complete !== 3) return;
    setClaimed(true);
    animateFeedback(coins.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)', offset: 0.35 }, { transform: 'translateY(0)' }], 600);
  };
  const reset = () => {
    coins.current?.getAnimations().forEach(animation => animation.cancel());
    setDone([false, false, false]); setClaimed(false);
  };
  const tasks = [text('采集三株月光草', 'Gather three moon herbs'), text('点亮林间的路灯', 'Light the forest lantern'), text('把消息带回营地', 'Return to the camp')];
  return <div className="home-game-quest" data-claimed={claimed}>
    <div className="home-game-quest__heading">
      <DocsIcon data={scrollIcon} size={30} />
      <PencilText as="h2">{text('接一份森林委托', 'A quest in the woods')}</PencilText>
    </div>
    <PencilText as="p" className="home-game-note">{text('替营地跑个腿，回来领一小袋金币。', 'Help the camp and earn a little bag of coins.')}</PencilText>
    <div className="home-game-quest__tasks">
      {tasks.map((label, index) => <Checkbox key={index} label={label} checked={done[index]} disabled={claimed}
        onCheckedChange={checked => setDone(current => current.map((value, position) => position === index ? checked : value))} />)}
    </div>
    <Progress value={complete} max={tasks.length} shape="segmented" segmentCount={3} size="sm"
      label={text('委托进度', 'Quest progress')}>{complete} / {tasks.length}</Progress>
    <div className="home-game-quest__wallet">
      <span ref={coins} className="home-game-quest__coins"><DocsIcon data={coinsIcon} size={30} />
        <NumberTicker value={claimed ? 200 : 120} animation="morph" duration={600}
          getValueLabel={(_, formatted) => text(`持有 ${formatted} 枚金币`, `${formatted} coins in your purse`)} />
      </span>
      <Badge>{text('奖励 +80', 'Reward +80')}</Badge>
    </div>
    <div className="home-game-quest__actions">
      <Button variant="outline" disabled={complete !== tasks.length || claimed} onClick={claim}>
        {claimed ? text('奖励已领取', 'Reward claimed') : text('领取奖励', 'Claim reward')}
      </Button>
      <Button variant="ghost" disabled={!claimed && complete === 0} onClick={reset}>
        {text('重新开始', 'Start again')}
      </Button>
    </div>
    <PencilText as="p" role="status" className="home-game-note home-game-quest__status">
      {claimed ? text('委托完成，80 枚金币已经放进行囊。', 'Quest complete. 80 coins added to your purse.')
        : complete === tasks.length ? text('都做完了，领取你的奖励吧。', 'All done. Your reward is ready.')
          : text('勾选完成的目标，集齐三项后领取奖励。', 'Check off all three objectives to claim the reward.')}
    </PencilText>
  </div>;
}

type Material = 'herb' | 'water' | 'crystal';
type Recipe = 'healing' | 'mana';
const initialMaterials: Record<Material, number> = { herb: 6, water: 5, crystal: 2 };
const recipes: Record<Recipe, Partial<Record<Material, number>>> = {
  healing: { herb: 2, water: 1 },
  mana: { water: 2, crystal: 1 },
};
const materialIcons = { herb: leafIcon, water: waterIcon, crystal: crystalIcon };
const materialKeys: Material[] = ['herb', 'water', 'crystal'];

export function HomeCraftingSample() {
  const text = useGameText();
  const [recipe, setRecipe] = useState<Recipe>('healing');
  const [stock, setStock] = useState(initialMaterials);
  const [crafted, setCrafted] = useState<Record<Recipe, number>>({ healing: 0, mana: 0 });
  const [lastCrafted, setLastCrafted] = useState<Recipe | null>(null);
  const bottle = useRef<HTMLDivElement>(null);
  const pouch = useRef<HTMLDivElement>(null);
  const names = { herb: text('月光草', 'Moon herb'), water: text('清泉', 'Spring water'), crystal: text('星屑', 'Stardust') };
  const recipeNames = { healing: text('恢复药水', 'Healing potion'), mana: text('法力药水', 'Mana potion') };
  const requirements = recipes[recipe];
  const ready = materialKeys.every(material => stock[material] >= (requirements[material] ?? 0));
  const total = crafted.healing + crafted.mana;
  const craft = () => {
    if (!ready) return;
    setStock(current => Object.fromEntries(materialKeys.map(material => [material, current[material] - (requirements[material] ?? 0)])) as Record<Material, number>);
    setCrafted(current => ({ ...current, [recipe]: current[recipe] + 1 }));
    setLastCrafted(recipe);
    animateFeedback(bottle.current, [{ transform: 'rotate(0deg) translateY(0)' }, { transform: 'rotate(-5deg) translateY(-4px)', offset: 0.3 }, { transform: 'rotate(4deg) translateY(-2px)', offset: 0.6 }, { transform: 'rotate(0deg) translateY(0)' }], 650);
    animateFeedback(pouch.current, [{ opacity: 0.5, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], 520);
  };
  const reset = () => {
    bottle.current?.getAnimations().forEach(animation => animation.cancel());
    pouch.current?.getAnimations().forEach(animation => animation.cancel());
    setStock(initialMaterials); setCrafted({ healing: 0, mana: 0 }); setLastCrafted(null);
  };
  const choose = (id: Recipe) => {
    if (id === recipe) return;
    setRecipe(id);
    animateFeedback(bottle.current, [{ opacity: 0.45, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], 500);
  };
  return <div className="home-game-crafting" data-recipe={recipe}>
    <div className="home-game-crafting__heading">
      <PencilText as="h2">{text('在营火旁调一瓶药水', 'A little camp alchemy')}</PencilText>
      <Badge size="sm">{text('炼金', 'Alchemy')}</Badge>
    </div>
    <div className="home-game-crafting__recipes" role="group" aria-label={text('选择药水配方', 'Choose a potion recipe')}>
      {(['healing', 'mana'] as const).map(id => <Button key={id} variant={recipe === id ? 'secondary' : 'ghost'}
        aria-pressed={recipe === id} onClick={() => choose(id)}>{recipeNames[id]}</Button>)}
    </div>
    <div className="home-game-crafting__materials" aria-label={text('材料库存', 'Material stock')}>
      {materialKeys.map(material => <div key={material} className={`home-game-crafting__material home-game-crafting__material--${material}`}>
        <DocsIcon data={materialIcons[material]} size={34} />
        <PencilText>{names[material]}</PencilText>
        <PencilText className="home-game-note">{text(`库存 ${stock[material]}`, `Stock ${stock[material]}`)}</PencilText>
      </div>)}
    </div>
    <div className="home-game-crafting__result">
      <div ref={bottle} className="home-game-crafting__bottle"><DocsIcon data={flaskIcon} size={70} /></div>
      <PencilText>{materialKeys.filter(material => requirements[material]).map(material => `${names[material]} ×${requirements[material]}`).join(' + ')}</PencilText>
      <PencilText as="p" className="home-game-note">{text(`合成为 ${recipeNames[recipe]} ×1`, `Makes ${recipeNames[recipe]} ×1`)}</PencilText>
    </div>
    <Button variant="outline" fullWidth disabled={!ready} onClick={craft}>
      {ready ? text('开始调制', 'Brew a potion') : text('材料不足', 'Not enough materials')}
    </Button>
    <div ref={pouch} className="home-game-crafting__bag">
      <PencilText className="home-game-note">{text('药水袋', 'Potion pouch')}</PencilText>
      <PencilText>{text(`恢复 ×${crafted.healing} · 法力 ×${crafted.mana}`, `Healing ×${crafted.healing} · Mana ×${crafted.mana}`)}</PencilText>
    </div>
    <div className="home-game-crafting__footer">
      <PencilText as="p" role="status" className="home-game-note">{lastCrafted
        ? text(`已收好一瓶${recipeNames[lastCrafted]}。`, `${recipeNames[lastCrafted]} added to your pouch.`)
        : text('选好配方，让材料变成旅途的补给。', 'Turn a few ingredients into supplies for the road.')}</PencilText>
      <Button variant="ghost" size="sm" disabled={total === 0} onClick={reset}>
        {text('重新开始', 'Start again')}
      </Button>
    </div>
  </div>;
}
