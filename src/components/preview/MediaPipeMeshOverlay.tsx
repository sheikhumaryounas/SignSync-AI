import React, { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { generateSimulatedLandmarks, MediaPipeFrame } from '../../services/preview/aiEngine';
import { TouchFeedback } from './TouchFeedback';

interface MediaPipeMeshOverlayProps {
  isScanning: boolean;
  gestureSeed?: number;
  showLandmarks?: boolean;
  onToggleLandmarks?: () => void;
  detectedSignName?: string;
  confidence?: number;
}

export const MediaPipeMeshOverlay: React.FC<MediaPipeMeshOverlayProps> = ({
  isScanning,
  gestureSeed = 0,
  showLandmarks = true,
  onToggleLandmarks,
  detectedSignName,
  confidence = 0.96,
}) => {
  const [frame, setFrame] = useState<MediaPipeFrame>(generateSimulatedLandmarks(0));
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');

  // Scanning laser animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScanning) return;

    // Pulse scanning line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setFrame(generateSimulatedLandmarks(gestureSeed));
    }, 120);

    return () => clearInterval(interval);
  }, [isScanning, gestureSeed, scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 220],
  });

  return (
    <View style={styles.container}>
      {/* Dark Camera Viewfinder Canvas */}
      <View style={styles.cameraBackground}>
        {/* Silhouette Center Guide */}
        <View style={styles.silhouetteBox}>
          <Ionicons name="body-outline" size={105} color="rgba(0, 180, 216, 0.18)" />
        </View>

        {/* Tech Cyber Grid Lines */}
        <View style={styles.gridOverlay}>
          <View style={styles.gridColumn} />
          <View style={[styles.gridColumn, styles.gridColumnActive]} />
          <View style={styles.gridColumn} />
        </View>

        {/* Dynamic Holographic Scan Beam */}
        {isScanning && (
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY }],
              },
            ]}
          />
        )}
      </View>

      {/* MediaPipe Glowing Cyan Landmark Mesh Overlay */}
      {showLandmarks && (
        <View style={styles.meshCanvas} pointerEvents="none">
          {/* Face Landmarks */}
          {frame.faceMesh.map((pt, i) => (
            <View
              key={`face-${i}`}
              style={[
                styles.facePoint,
                { left: `${pt.x * 100}%`, top: `${pt.y * 100}%` },
              ]}
            />
          ))}

          {/* Right Hand Keypoints (Vibrant Glowing Cyan) */}
          {frame.handRight.map((pt, i) => (
            <View
              key={`r-hand-${i}`}
              style={[
                styles.handPointCyan,
                i === 0 ? styles.wristPoint : null,
                { left: `${pt.x * 100}%`, top: `${pt.y * 100}%` },
              ]}
            />
          ))}

          {/* Left Hand Keypoints */}
          {frame.handLeft.map((pt, i) => (
            <View
              key={`l-hand-${i}`}
              style={[
                styles.handPointNavy,
                i === 0 ? styles.wristPoint : null,
                { left: `${pt.x * 100}%`, top: `${pt.y * 100}%` },
              ]}
            />
          ))}

          {/* Pose Skeleton Points */}
          {frame.poseSkeleton.map((pt, i) => (
            <View
              key={`pose-${i}`}
              style={[
                styles.posePoint,
                { left: `${pt.x * 100}%`, top: `${pt.y * 100}%` },
              ]}
            />
          ))}
        </View>
      )}

      {/* Glassmorphism Top HUD Bar */}
      <View style={styles.topHud}>
        <View style={styles.glassPillRow}>
          <View style={styles.edgePill}>
            <View style={styles.pulseCyanDot} />
            <Text style={styles.edgePillText}>
              MediaPipe • {frame.edgeLatencyMs}ms
            </Text>
          </View>
          <View style={styles.fpsPill}>
            <Text style={styles.fpsPillText}>60 FPS</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchFeedback
            style={[styles.hudBtn, torchOn && styles.hudBtnActive]}
            onPress={() => setTorchOn(!torchOn)}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={15}
              color={torchOn ? '#001A38' : '#FFFFFF'}
            />
          </TouchFeedback>

          <TouchFeedback
            style={styles.hudBtn}
            onPress={() => setCameraFacing(cameraFacing === 'front' ? 'back' : 'front')}
          >
            <Ionicons name="camera-reverse-outline" size={16} color="#FFFFFF" />
          </TouchFeedback>

          {onToggleLandmarks && (
            <TouchFeedback
              style={[styles.hudBtn, showLandmarks && styles.hudBtnActive]}
              onPress={onToggleLandmarks}
            >
              <Ionicons
                name="git-network-outline"
                size={16}
                color={showLandmarks ? '#001A38' : '#FFFFFF'}
              />
            </TouchFeedback>
          )}
        </View>
      </View>

      {/* Center Target Box with Futuristic Circuit Corners */}
      <View style={styles.targetFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {detectedSignName && (
          <View style={styles.detectedTag}>
            <Ionicons name="checkmark-circle" size={13} color="#001A38" style={{ marginRight: 4 }} />
            <Text style={styles.detectedTagText}>
              {detectedSignName} • {Math.round(confidence * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Privacy & Neural Status Badge */}
      <View style={styles.bottomHud}>
        <View style={styles.bottomStatusChip}>
          <Ionicons name="shield-checkmark" size={11} color="#00E5FF" style={{ marginRight: 5 }} />
          <Text style={styles.privacyText}>
            On-Device PyTorch Inference • Private & Encrypted
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 255,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#040E1B',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    shadowColor: '#002855',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#040E1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteBox: {
    opacity: 0.2,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    opacity: 0.12,
  },
  gridColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#00E5FF',
  },
  gridColumnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 5,
  },
  meshCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  facePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00E5FF',
    marginLeft: -2,
    marginTop: -2,
  },
  handPointCyan: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E5FF',
    marginLeft: -3.5,
    marginTop: -3.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  handPointNavy: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0A3B75',
    marginLeft: -3.5,
    marginTop: -3.5,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  wristPoint: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
  },
  posePoint: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 229, 255, 0.75)',
    marginLeft: -2.5,
    marginTop: -2.5,
  },
  topHud: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  glassPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  edgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 18, 36, 0.82)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  fpsPill: {
    backgroundColor: 'rgba(4, 18, 36, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fpsPillText: {
    color: '#A5F3FC',
    fontSize: 9.5,
    fontWeight: '800',
  },
  pulseCyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
    marginRight: 6,
  },
  edgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hudBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(4, 18, 36, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  hudBtnActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#FFFFFF',
  },
  targetFrame: {
    position: 'absolute',
    top: 38,
    bottom: 38,
    left: 38,
    right: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.22)',
    borderRadius: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#00E5FF',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 5,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 5,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 5,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 5,
  },
  detectedTag: {
    marginTop: 8,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  detectedTagText: {
    color: '#001A38',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  bottomHud: {
    position: 'absolute',
    bottom: 7,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  bottomStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 18, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  privacyText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
  },
});
