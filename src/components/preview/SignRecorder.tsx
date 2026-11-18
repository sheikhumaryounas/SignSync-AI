import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { fonts, palette, radius, spacing, useDirection, themedStyles } from '../../theme';
import { AppText, Button, IconButton, Notice } from '../ui';
import { StringKey, useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import {
  recognizeSignVideo,
  ServerStatus,
  signApiLastFailure,
  signApiUrl,
  SignApiError,
  SignResult,
  signServerStatus,
} from '../../services/recognition/signApi';

const COUNTDOWN_SECONDS = 3;
// Single ASL signs take one to two seconds; the server trims the frames without hands.
const RECORD_SECONDS = 3;

type Phase = 'idle' | 'countdown' | 'recording' | 'processing';

interface SignRecorderProps {
  /** Runs before Settings opens, e.g. to close the sheet the recorder sits in. */
  onOpenSettings?: () => void;
  onResult: (result: SignResult) => void;
  /** Pauses the camera (e.g. while a dialog is open). */
  paused?: boolean;
  height?: number;
}

export function signErrorKey(e: unknown): StringKey {
  const code = e instanceof SignApiError ? e.code : 'unknown';
  return `signApi.${code}` as StringKey;
}

// Records one sign with the camera and sends it to the recognition server.
export function SignRecorder({ onResult, paused = false, height = 300, onOpenSettings }: SignRecorderProps) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { t } = useI18n();
  const { row } = useDirection();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [focused, setFocused] = useState(true);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [error, setError] = useState<StringKey>();
  const [server, setServer] = useState<ServerStatus | null>(null);
  const offline = server === 'unreachable' || server === 'server_down';

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Release the camera when the screen is left; another screen may need it.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setReady(false);
        clearTimers();
        camera.current?.stopRecording();
        setPhase('idle');
      };
    }, [])
  );

  // Users open Settings from the root stack; for admins it is a tab inside AdminMain.
  const openSettings = () => {
    onOpenSettings?.();
    if (user?.role === 'admin') navigation.navigate('AdminMain', { screen: 'Preferences' });
    else navigation.navigate('Preferences');
  };

  const checkServer = useCallback(() => {
    setServer(null);
    signServerStatus().then(setServer);
  }, []);

  // Checked on every visit, so a server address changed in Settings applies on return.
  useFocusEffect(checkServer);

  // The camera unmounts while paused; it reports ready again when it comes back.
  useEffect(() => {
    if (paused) setReady(false);
  }, [paused]);

  const record = async () => {
    if (!camera.current) return;
    setPhase('recording');
    try {
      const video = await camera.current.recordAsync({ maxDuration: RECORD_SECONDS });
      if (!video?.uri) throw new SignApiError('bad_video', 'Nothing was recorded.');
      setPhase('processing');
      const result = await recognizeSignVideo(video.uri);
      setServer('online');
      onResult(result);
    } catch (e) {
      if (e instanceof SignApiError && e.code === 'server_down') setServer('server_down');
      else if (e instanceof SignApiError && (e.code === 'unreachable' || e.code === 'timeout')) setServer('unreachable');
      setError(signErrorKey(e));
    } finally {
      setPhase('idle');
    }
  };

  const start = () => {
    setError(undefined);
    setPhase('countdown');
    setCount(COUNTDOWN_SECONDS);
    for (let i = 1; i <= COUNTDOWN_SECONDS; i++) {
      timers.current.push(
        setTimeout(() => {
          if (i === COUNTDOWN_SECONDS) record();
          else setCount(COUNTDOWN_SECONDS - i);
        }, i * 1000)
      );
    }
  };

  const cancel = () => {
    clearTimers();
    if (phase === 'recording') camera.current?.stopRecording();
    setPhase('idle');
  };

  if (Platform.OS === 'web') {
    return <Notice tone="warning" message={t('signApi.webUnsupported')} />;
  }

  if (!permission) {
    return (
      <View style={[styles.frame, styles.center, { height }]}>
        <ActivityIndicator color={palette.white} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.frame, styles.center, styles.permission, { height }]}>
        <AppText style={styles.overlayTitle} align="center">
          {t('signApi.permissionTitle')}
        </AppText>
        <AppText style={styles.overlayText} align="center">
          {t('signApi.permissionBody')}
        </AppText>
        <Button
          title={permission.canAskAgain ? t('signApi.allowCamera') : t('signApi.openSettings')}
          variant="teal"
          fullWidth={false}
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
        />
      </View>
    );
  }

  const busy = phase !== 'idle';
  const status =
    phase === 'countdown'
      ? t('signApi.getReady')
      : phase === 'recording'
        ? t('signApi.recording')
        : phase === 'processing'
          ? t('signApi.processing')
          : t('signApi.live');

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { height }]}>
        {focused && !paused ? (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mode="video"
            mute
            videoQuality="480p"
            onCameraReady={() => setReady(true)}
          />
        ) : null}

        <View style={[styles.top, row]}>
          <View style={[styles.tag, phase === 'recording' ? styles.tagRecording : null]}>
            <AppText style={styles.tagText}>{status}</AppText>
          </View>
          <IconButton
            icon="camera-reverse-outline"
            tone="glass"
            accessibilityLabel={t('signApi.flip')}
            onPress={busy ? undefined : () => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
          />
        </View>

        {phase === 'countdown' ? (
          <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
            <AppText style={styles.count} accessibilityLiveRegion="assertive">
              {count}
            </AppText>
          </View>
        ) : null}

        {phase === 'processing' ? (
          <View style={[StyleSheet.absoluteFill, styles.center, styles.dim]}>
            <ActivityIndicator color={palette.white} size="large" />
          </View>
        ) : null}

        {phase === 'idle' ? (
          <View style={styles.hint} pointerEvents="none">
            <AppText style={styles.hintText} align="center">
              {t('signApi.framing')}
            </AppText>
          </View>
        ) : null}
      </View>

      {offline ? (
        <View style={styles.gap}>
          <Notice
            tone="warning"
            message={
              server === 'server_down'
                ? t('signApi.server_down')
                : signApiUrl()
                  ? t('signApi.offlineAt', { url: signApiUrl()! })
                  : t('signApi.noAddress')
            }
          />
          {signApiLastFailure() ? (
            <AppText variant="caption" selectable>
              {t('signApi.detail', { detail: signApiLastFailure()! })}
            </AppText>
          ) : null}
          <View style={[styles.actions, row]}>
            <Button title={t('server.title')} variant="ghost" onPress={openSettings} style={styles.flex} />
            <Button title={t('signApi.checkAgain')} variant="ghost" onPress={checkServer} style={styles.flex} />
          </View>
        </View>
      ) : null}
      {error && !offline ? <Notice tone="error" message={t(error)} /> : null}

      {phase === 'countdown' || phase === 'recording' ? (
        <Button title={t('common.cancel')} variant="ghost" onPress={cancel} />
      ) : (
        <Button
          title={t('signApi.record')}
          variant="teal"
          loading={phase === 'processing'}
          disabled={!ready || offline}
          onPress={start}
        />
      )}
    </View>
  );
}

const styles = themedStyles(() => ({
  wrap: { gap: spacing.md },
  gap: { gap: spacing.sm },
  actions: { gap: spacing.sm },
  flex: { flex: 1 },
  frame: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: palette.navy },
  center: { alignItems: 'center', justifyContent: 'center' },
  permission: { gap: spacing.md, padding: spacing.xl },
  overlayTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: palette.white },
  overlayText: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: palette.white, opacity: 0.85 },
  top: { alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  tag: { backgroundColor: palette.glass, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  tagRecording: { backgroundColor: palette.error },
  tagText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: palette.white },
  count: { fontFamily: fonts.semibold, fontSize: 72, lineHeight: 84, color: palette.white },
  dim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  hint: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: palette.glass,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  hintText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: palette.white },
}));
