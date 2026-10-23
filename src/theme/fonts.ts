import { useFonts } from 'expo-font';
import {
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
} from '@expo-google-fonts/lexend';
import {
  NotoNastaliqUrdu_400Regular,
  NotoNastaliqUrdu_600SemiBold,
} from '@expo-google-fonts/noto-nastaliq-urdu';

// Loads every face the type scale uses. Returns [loaded, error].
export function useAppFonts() {
  return useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    NotoNastaliqUrdu_400Regular,
    NotoNastaliqUrdu_600SemiBold,
  });
}
