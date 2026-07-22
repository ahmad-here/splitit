import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { CURRENCY } from '@/utils/format';

export type AmountTextProps = Omit<ThemedTextProps, 'children'> & {
  amount: number;
  currency?: string;
  /** When true, color green if positive (owed) and red if negative (owe). */
  signed?: boolean;
};

export function formatAmount(amount: number, currency = CURRENCY): string {
  const sign = amount < 0 ? '-' : '';
  const [whole, dec] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${currency}${grouped}.${dec}`;
}

export function AmountText({ amount, currency = CURRENCY, signed = false, style, type = 'smallBold', ...rest }: AmountTextProps) {
  const theme = useTheme();
  const color = !signed ? theme.text : amount > 0 ? theme.owed : amount < 0 ? theme.owe : theme.muted;
  return (
    <ThemedText type={type} style={[{ color }, style]} {...rest}>
      {formatAmount(amount, currency)}
    </ThemedText>
  );
}
