import React, { useContext } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { fonts, palette, TextScaleContext, type, TextVariant } from '../../theme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

const defaultColor: Partial<Record<TextVariant, string>> = {
  display: palette.navy,
  title: palette.navy,
  heading: palette.ink,
  label: palette.muted,
  caption: palette.ink2,
  urdu: palette.ink,
  urduSm: palette.ink2,
};

const URDU_RE = /[؀-ۿ]/;
const strongVariants: TextVariant[] = ['display', 'title', 'heading', 'button', 'label'];

function containsUrdu(children: React.ReactNode): boolean {
  if (typeof children === 'string') return URDU_RE.test(children);
  if (Array.isArray(children)) return children.some(containsUrdu);
  return false;
}

// Lexend has no Urdu glyphs, so any Urdu string switches to Nastaliq with the taller line
// height that script needs. Callers pass translated strings and never pick fonts themselves.
function urduStyle(variant: TextVariant, scale: number, align?: TextStyle['textAlign']): TextStyle {
  const base = StyleSheet.flatten(type[variant]);
  const size = (base.fontSize ?? 14) * scale;
  return {
    fontFamily: strongVariants.includes(variant) ? fonts.urduSemibold : fonts.urdu,
    fontSize: variant === 'label' ? size + 2 : size,
    lineHeight: Math.round(size * 2.1),
    letterSpacing: 0,
    textTransform: 'none',
    writingDirection: 'rtl',
    textAlign: align ?? 'right',
  };
}

export function AppText({ variant = 'body', color, align, style, children, ...rest }: AppTextProps) {
  const scale = useContext(TextScaleContext);
  const isUrduVariant = variant === 'urdu' || variant === 'urduSm';
  const autoUrdu = !isUrduVariant && containsUrdu(children);
  const urdu = autoUrdu ? urduStyle(variant, scale, align) : null;
  const base = type[variant];
  const scaled =
    scale !== 1 && base.fontSize ? { fontSize: base.fontSize * scale, lineHeight: (base.lineHeight ?? base.fontSize * 1.4) * scale } : null;

  return (
    <Text
      {...rest}
      style={[
        base,
        scaled,
        { color: color ?? defaultColor[variant] ?? palette.ink },
        urdu,
        align ? { textAlign: align } : null,
        style,
        // A caller's Latin fontFamily must never win over Nastaliq for Urdu text.
        urdu ? { fontFamily: urdu.fontFamily } : null,
      ]}
    >
      {children}
    </Text>
  );
}
