import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { SignVocabularyItem } from '../../types';
import { TouchFeedback } from './TouchFeedback';
import { usePreview } from '../../context/PreviewContext';

interface SignAvatarComponentProps {
  currentSign?: SignVocabularyItem | null;
  signSequence?: SignVocabularyItem[];
  isPlaying?: boolean;
  unsupportedWords?: string[];
  fingerspelledWords?: { word: string; letters: string[] }[];
  onPlayToggle?: () => void;
  onTogglePlay?: () => void;
  onReplay?: () => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  onChangeSpeed?: (speed: number) => void;
}

export const SignAvatarComponent: React.FC<SignAvatarComponentProps> = ({
  currentSign,
  signSequence = [],
  isPlaying = true,
  unsupportedWords = [],
  onPlayToggle,
  onTogglePlay,
  onReplay,
  speed = 1.0,
  onSpeedChange,
  onChangeSpeed,
}) => {
  const { speakText, isSpeaking, stopSpeaking, theme, isDark } = usePreview();
  const handleTogglePlay = onTogglePlay || onPlayToggle;
  const handleChangeSpeed = onChangeSpeed || onSpeedChange;

  const [activeSignIndex, setActiveSignIndex] = useState<number>(0);
  const [cameraAngle, setCameraAngle] = useState<'front' | 'angle' | 'side'>('front');
  
  // Animation values
  const handBounce = useRef(new Animated.Value(0)).current;
  const syncRotation = useRef(new Animated.Value(0)).current;
  const circuitPulse = useRef(new Animated.Value(0.85)).current;
  const angleRotate = useRef(new Animated.Value(0)).current;

  const activeSign = signSequence.length > 0
    ? signSequence[activeSignIndex]
    : currentSign;

  // Handle angle rotation animation
  useEffect(() => {
    let targetDeg = 0;
    if (cameraAngle === 'angle') targetDeg = 25;
    if (cameraAngle === 'side') targetDeg = 55;

    Animated.spring(angleRotate, {
      toValue: targetDeg,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [cameraAngle, angleRotate]);

  useEffect(() => {
    if (!isPlaying) return;

    // Hand sign rhythmic motion
    const handAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(handBounce, {
          toValue: 1,
          duration: 650 / speed,
          useNativeDriver: true,
        }),
        Animated.timing(handBounce, {
          toValue: 0,
          duration: 650 / speed,
          useNativeDriver: true,
        }),
      ])
    );

    // Sync circle rotation in background
    const rotateAnim = Animated.loop(
      Animated.timing(syncRotation, {
        toValue: 1,
        duration: 8000 / speed,
        useNativeDriver: true,
      })
    );

    // Circuit glow pulse
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(circuitPulse, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(circuitPulse, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    handAnim.start();
    rotateAnim.start();
    pulseAnim.start();

    return () => {
      handAnim.stop();
      rotateAnim.stop();
      pulseAnim.stop();
    };
  }, [isPlaying, speed, activeSignIndex, handBounce, syncRotation, circuitPulse]);

  // Automatic sequence progression
  useEffect(() => {
    if (!isPlaying || signSequence.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSignIndex(prev => (prev + 1) % signSequence.length);
    }, 2400 / speed);

    return () => clearInterval(timer);
  }, [isPlaying, signSequence, speed]);

  const translateY = handBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const rotateDeg = syncRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const avatarPerspectiveRotate = angleRotate.interpolate({
    inputRange: [0, 55],
    outputRange: ['0deg', '55deg'],
  });

  const handleSpeakCurrentSign = () => {
    if (!activeSign) return;
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(activeSign.signNameUrdu);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner with Active Gesture Badge & Angle Controls */}
      <View style={styles.topBar}>
        <View style={styles.signBadge}>
          <Ionicons name="hand-left" size={14} color="#00E5FF" style={{ marginRight: 5 }} />
          <Text style={styles.signNameText}>
            {activeSign?.signNameEnglish.split('/')[0].trim() || 'SignSync 3D Avatar'}
          </Text>
        </View>

        {/* Multi-Angle View Toggle */}
        <View style={styles.angleSelector}>
          {[
            { id: 'front' as const, label: 'Front' },
            { id: 'angle' as const, label: '45°' },
            { id: 'side' as const, label: 'Side' },
          ].map(ang => (
            <TouchFeedback
              key={ang.id}
              style={[styles.angleBtn, cameraAngle === ang.id && styles.angleBtnActive]}
              onPress={() => setCameraAngle(ang.id)}
            >
              <Text style={[styles.angleBtnText, cameraAngle === ang.id && styles.angleBtnTextActive]}>
                {ang.label}
              </Text>
            </TouchFeedback>
          ))}
        </View>
      </View>

      {/* Main Avatar Stage with 3D Perspective Rotation */}
      <View style={styles.avatarStage}>
        {/* Rotating Sync Ambient Ring */}
        <Animated.View
          style={[
            styles.syncCircleBackdrop,
            { transform: [{ rotate: rotateDeg }] },
          ]}
        >
          <View style={styles.ambientOuterRing} />
        </Animated.View>

        {/* Animated 3D Character Body */}
        <Animated.View
          style={[
            styles.avatarBodyContainer,
            {
              transform: [{ rotateY: avatarPerspectiveRotate }],
            },
          ]}
        >
          {/* Avatar Head */}
          <View style={styles.avatarHead}>
            <View style={styles.avatarHair} />
            <View style={styles.avatarEyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.avatarSmile} />
          </View>

          {/* Avatar Torso with Navy & Glowing Circuit Motif */}
          <View style={styles.avatarTorso}>
            <View style={styles.collar} />
            <Animated.View style={[styles.circuitGlow, { transform: [{ scale: circuitPulse }] }]}>
              <Ionicons name="git-commit-outline" size={20} color="#00E5FF" />
            </Animated.View>
          </View>

          {/* Hands Performing Sign Gesture */}
          <Animated.View
            style={[
              styles.handsContainer,
              { transform: [{ translateY }] },
            ]}
          >
            {/* Left Hand: Human-form navy glove */}
            <View style={styles.navyHandBox}>
              <Ionicons name="hand-left" size={22} color="#FFFFFF" />
            </View>

            {/* Central Motion Cyber Link */}
            <View style={styles.centerMotion}>
              <Ionicons name="pulse" size={14} color="#00E5FF" />
            </View>

            {/* Right Hand: High-tech circuit hand with cyan nodes */}
            <View style={styles.techHandBox}>
              <Ionicons name="hand-left-outline" size={22} color="#00E5FF" />
              <View style={styles.circuitNode1} />
              <View style={styles.circuitNode2} />
            </View>
          </Animated.View>
        </Animated.View>

        {/* Urdu & English Subtitle Pill with Instant Pronounce Speaker */}
        {activeSign && (
          <View style={styles.subtitlePill}>
            <View style={styles.subtitleTextGroup}>
              <Text style={styles.subtitleUrdu}>{activeSign.signNameUrdu}</Text>
              <Text style={styles.subtitleEng} numberOfLines={1}>
                {activeSign.descriptionEnglish}
              </Text>
            </View>
            <TouchFeedback
              style={[styles.ttsSmallBtn, isSpeaking && styles.ttsSmallBtnActive]}
              onPress={handleSpeakCurrentSign}
            >
              <Ionicons
                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={16}
                color={isSpeaking ? '#00E5FF' : '#FFFFFF'}
              />
            </TouchFeedback>
          </View>
        )}
      </View>

      {/* Interactive Sequence Scrubber Timeline */}
      {signSequence.length > 1 && (
        <View style={styles.timelineScrubber}>
          <Text style={styles.scrubberLabel}>SEQUENCE SCRUBBER:</Text>
          <View style={styles.timelineRow}>
            {signSequence.map((item, idx) => {
              const isActive = activeSignIndex === idx;
              return (
                <TouchFeedback
                  key={item.id + idx}
                  style={[
                    styles.timelineChip,
                    isActive && styles.timelineChipActive,
                  ]}
                  onPress={() => setActiveSignIndex(idx)}
                >
                  <Text
                    style={[
                      styles.timelineChipText,
                      isActive && styles.timelineChipTextActive,
                    ]}
                  >
                    {idx + 1}. {item.signNameEnglish.split('/')[0].trim()}
                  </Text>
                </TouchFeedback>
              );
            })}
          </View>
        </View>
      )}

      {/* Playback Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.leftControls}>
          <TouchFeedback
            style={styles.playBtn}
            onPress={handleTogglePlay}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={13}
              color="#001A38"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.playBtnText}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchFeedback>

          <TouchFeedback
            style={styles.replayBtn}
            onPress={() => {
              setActiveSignIndex(0);
              if (onReplay) onReplay();
            }}
          >
            <Ionicons name="reload-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.replayBtnText}>Replay</Text>
          </TouchFeedback>
        </View>

        {/* Speed Selector Pills */}
        {handleChangeSpeed && (
          <View style={styles.speedRow}>
            {[0.5, 1.0, 1.5].map(s => (
              <TouchFeedback
                key={s}
                style={[styles.speedPill, speed === s && styles.speedPillActive]}
                onPress={() => handleChangeSpeed(s)}
              >
                <Text
                  style={[
                    styles.speedPillText,
                    speed === s && styles.speedPillTextActive,
                  ]}
                >
                  {s}x
                </Text>
              </TouchFeedback>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040E1B',
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    shadowColor: '#002855',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  signNameText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  angleSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  angleBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  angleBtnActive: {
    backgroundColor: '#00E5FF',
  },
  angleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  angleBtnTextActive: {
    color: '#001A38',
    fontWeight: '800',
  },
  avatarStage: {
    height: 205,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  syncCircleBackdrop: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientOuterRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderStyle: 'dashed',
  },
  avatarBodyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHead: {
    width: 66,
    height: 70,
    borderRadius: 33,
    backgroundColor: '#F7D6BD',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#E8B998',
  },
  avatarHair: {
    position: 'absolute',
    top: -3,
    width: 62,
    height: 22,
    backgroundColor: '#001A38',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  avatarEyes: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#001E3D',
  },
  avatarSmile: {
    width: 12,
    height: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginTop: 4,
  },
  avatarTorso: {
    width: 104,
    height: 72,
    backgroundColor: '#002855',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -8,
    alignItems: 'center',
    paddingTop: 8,
    zIndex: 1,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  collar: {
    width: 22,
    height: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#F7D6BD',
  },
  circuitGlow: {
    marginTop: 6,
  },
  handsContainer: {
    position: 'absolute',
    top: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 204,
    zIndex: 3,
  },
  navyHandBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#002855',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  centerMotion: {
    paddingHorizontal: 6,
  },
  techHandBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#041528',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E5FF',
    elevation: 4,
    position: 'relative',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  circuitNode1: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
  },
  circuitNode2: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
  },
  subtitlePill: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: 'rgba(4, 18, 36, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    width: '94%',
  },
  subtitleTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  subtitleUrdu: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'left',
  },
  subtitleEng: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 1,
  },
  ttsSmallBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ttsSmallBtnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    borderColor: '#00E5FF',
  },
  timelineScrubber: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrubberLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timelineChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  timelineChipActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  timelineChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  timelineChipTextActive: {
    color: '#001A38',
    fontWeight: '900',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftControls: {
    flexDirection: 'row',
    gap: 6,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playBtnText: {
    color: '#001A38',
    fontSize: 11,
    fontWeight: '800',
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  replayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  speedRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedPillActive: {
    backgroundColor: '#00E5FF',
  },
  speedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  speedPillTextActive: {
    color: '#001A38',
    fontWeight: '900',
  },
});
