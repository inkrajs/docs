import { useState } from 'react';
import { Calendar } from '@inkra/react';
import { enUS, zhCN } from 'react-day-picker/locale';
import { useLocale } from '../i18n';

export function HomeCalendar() {
  const { locale } = useLocale();
  const [selected, setSelected] = useState<Date | undefined>(new Date(2026, 9, 21));
  const english = locale === 'en';
  return <section className="home-calendar" aria-label={english ? 'Calendar example' : '日历示例'}>
    <Calendar appearance="itinerary" mode="single" selected={selected} onSelect={setSelected}
      defaultMonth={new Date(2026, 9, 21)} locale={english ? enUS : zhCN} weekStartsOn={1} showOutsideDays={false} />
  </section>;
}
