import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppTheme, Fonts, Radius, ToneKey } from "@/constants/theme";
import { StopKind, stopKindLabel } from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";

interface RouteProgressProps {
  completedCount: number;
  totalCount: number;
  countByKind: Record<StopKind, number>;
}

const toneByKind: Record<StopKind, ToneKey> = {
  [StopKind.Dropoff]: ToneKey.Dropoff,
  [StopKind.Refill]: ToneKey.Refill,
  [StopKind.Pickup]: ToneKey.Pickup,
};

export function RouteProgress({
  completedCount,
  totalCount,
  countByKind,
}: RouteProgressProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const isRouteComplete = totalCount > 0 && completedCount === totalCount;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.set(withTiming(progress, { duration: 400 }));
  }, [animatedProgress, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.get() * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.countRow}>
          <Text style={styles.count}>{completedCount}</Text>
          <Text style={styles.countLabel}>
            {isRouteComplete
              ? "stops · route complete"
              : `of ${totalCount} stops done`}
          </Text>
        </View>
        <Text
          style={[
            styles.percent,
            isRouteComplete
              ? { color: colors.tone[ToneKey.Done].foreground }
              : undefined,
          ]}
        >
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <View
        accessibilityLabel={`${completedCount} of ${totalCount} stops done`}
        accessibilityRole="progressbar"
        accessibilityValue={{ max: totalCount, min: 0, now: completedCount }}
        style={styles.track}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: colors.tone[ToneKey.Done].accent },
            fillStyle,
          ]}
        />
      </View>
      <View style={styles.legend}>
        {Object.values(StopKind).map((kind) => (
          <View key={kind} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.tone[toneByKind[kind]].accent },
              ]}
            />
            <Text style={styles.legendText}>
              <Text style={styles.legendValue}>{countByKind[kind]}</Text>{" "}
              {stopKindLabel[kind].toLowerCase()}
              {countByKind[kind] === 1 ? "" : "s"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    countRow: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: 6,
    },
    count: {
      color: theme.colors.text,
      fontFamily: Fonts?.rounded,
      fontSize: 24,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    countLabel: {
      color: theme.colors.textMuted,
      fontSize: 15,
      fontWeight: "600",
    },
    percent: {
      color: theme.colors.textSubtle,
      fontFamily: Fonts?.rounded,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
    },
    track: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: Radius.pill,
      height: 8,
      overflow: "hidden",
    },
    fill: {
      borderRadius: Radius.pill,
      height: "100%",
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    legendItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    legendDot: {
      borderRadius: 5,
      height: 10,
      width: 10,
    },
    legendText: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "500",
    },
    legendValue: {
      color: theme.colors.text,
      fontWeight: "800",
    },
  });
