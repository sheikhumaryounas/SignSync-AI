import { palette } from '../../theme';
import { LatencyBreakdown } from '../../services/api';
import { StringKey } from '../../i18n';

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export const signed = (x: number, digits = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(digits)}`;

export const latencyParts: { key: keyof Omit<LatencyBreakdown, 'totalMs'>; label: StringKey; color: string }[] = [
  { key: 'edgeMs', label: 'metrics.edge', get color() { return palette.teal; } },
  { key: 'networkMs', label: 'metrics.network', get color() { return palette.chartBlue; } },
  { key: 'inferenceMs', label: 'metrics.inference', get color() { return palette.navyText; } },
  { key: 'correctionMs', label: 'metrics.correction', get color() { return palette.chartAmber; } },
];
