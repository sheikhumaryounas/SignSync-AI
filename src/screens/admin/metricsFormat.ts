import { palette } from '../../theme';
import { LatencyBreakdown } from '../../services/api';
import { StringKey } from '../../i18n';

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export const signed = (x: number, digits = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(digits)}`;

export const latencyParts: { key: keyof Omit<LatencyBreakdown, 'totalMs'>; label: StringKey; color: string }[] = [
  { key: 'edgeMs', label: 'metrics.edge', color: palette.teal },
  { key: 'networkMs', label: 'metrics.network', color: palette.chartBlue },
  { key: 'inferenceMs', label: 'metrics.inference', color: palette.navy },
  { key: 'correctionMs', label: 'metrics.correction', color: palette.chartAmber },
];
