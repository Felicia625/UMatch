import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MIN_AGE } from '../constants/options';
import { useTheme } from '../constants/theme';
import { daysInMonth, parseIsoDate, toIsoDate } from '../utils/age';
import { OptionPicker } from './ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Day / month / year dropdowns. Reports 'YYYY-MM-DD' once all three are chosen, otherwise ''. */
export function BirthDateField({ value, onChange }: { value: string; onChange: (isoDate: string) => void }) {
  const t = useTheme();
  const initial = parseIsoDate(value);
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [month, setMonth] = useState(initial ? String(initial.month) : '');
  const [day, setDay] = useState(initial ? String(initial.day) : '');

  function update(next: { year: string; month: string; day: string }) {
    const { year: y, month: m } = next;
    let d = next.day;
    if (y && m && d) d = String(Math.min(Number(d), daysInMonth(Number(y), Number(m)))); // e.g. 31 -> 28 when Feb is picked
    setYear(y);
    setMonth(m);
    setDay(d);
    onChange(y && m && d ? toIsoDate(Number(y), Number(m), Number(d)) : '');
  }

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 60 - MIN_AGE + 1 }, (_, i) => String(thisYear - MIN_AGE - i)).map((y) => ({ value: y, label: y }));
  const months = MONTHS.map((label, i) => ({ value: String(i + 1), label }));
  const maxDay = year && month ? daysInMonth(Number(year), Number(month)) : 31;
  const days = Array.from({ length: maxDay }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

  return (
    <View>
      <Text style={{ color: t.textSecondary, marginBottom: 6 }}>Date of birth</Text>
      <View style={styles.row}>
        <View style={{ flex: 0.8 }}>
          <OptionPicker label="Day" value={day} options={days} onChange={(v) => update({ year, month, day: v })} />
        </View>
        <View style={{ flex: 1.5 }}>
          <OptionPicker label="Month" value={month} options={months} onChange={(v) => update({ year, month: v, day })} />
        </View>
        <View style={{ flex: 1 }}>
          <OptionPicker label="Year" value={year} options={years} onChange={(v) => update({ year: v, month, day })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});
