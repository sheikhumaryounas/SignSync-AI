import { StyleSheet } from 'react-native';
import { getThemeVersion } from './colors';

type StyleInput = Parameters<typeof StyleSheet.create>[0];

/**
 * Drop-in for StyleSheet.create whose values follow the active theme. The factory reads the
 * live `palette` and is re-run lazily the first time a style is read after the theme changes.
 */
export function themedStyles<S extends StyleInput>(factory: () => S & StyleInput): Readonly<S> {
  let builtFor = getThemeVersion();
  let current = StyleSheet.create(factory());
  const out = {} as S;
  for (const key of Object.keys(current) as (keyof S)[]) {
    Object.defineProperty(out, key, {
      enumerable: true,
      get() {
        if (builtFor !== getThemeVersion()) {
          current = StyleSheet.create(factory());
          builtFor = getThemeVersion();
        }
        return current[key];
      },
    });
  }
  return out;
}
