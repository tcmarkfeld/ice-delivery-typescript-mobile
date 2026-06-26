import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  floatingTabBarBottomOffset,
  floatingTabBarHeight,
} from "@/constants/navigation";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import {
  FloatingTabBarProvider,
  useFloatingTabBar,
} from "@/providers/floating-tab-bar-provider";

type TabRoute = BottomTabBarProps["state"]["routes"][number];
type TabIconName = React.ComponentProps<typeof IconSymbol>["name"];
const visibleTabRouteNames = [
  "index",
  "add-delivery",
  "all-deliveries",
] as const;
type VisibleTabRouteName = (typeof visibleTabRouteNames)[number];
type VisibleTabRoute = TabRoute & { name: VisibleTabRouteName };

const tabIconNameByRoute: Record<VisibleTabRouteName, TabIconName> = {
  index: "house.fill",
  "add-delivery": "plus.circle.fill",
  "all-deliveries": "truck.box.fill",
};

const isVisibleTabRouteName = (
  routeName: string,
): routeName is VisibleTabRouteName => {
  return visibleTabRouteNames.includes(routeName as VisibleTabRouteName);
};

const isVisibleTabRoute = (route: TabRoute): route is VisibleTabRoute => {
  return isVisibleTabRouteName(route.name);
};

const getPlatformGlassShadow = (
  glass: ReturnType<typeof useAppTheme>["colors"]["liquidGlass"],
) =>
  Platform.select({
    ios: {
      shadowColor: glass.shadowColor,
      shadowOpacity: glass.shadowOpacity,
      shadowRadius: glass.shadowRadius,
      shadowOffset: { width: 0, height: glass.shadowOffsetHeight },
    },
    android: {
      elevation: glass.elevation,
    },
    web: {
      boxShadow: glass.webBoxShadow,
      backdropFilter: glass.webBackdropFilter,
    },
  });

const interpolate = (
  startValue: number,
  endValue: number,
  progress: number,
): number => {
  return startValue + (endValue - startValue) * progress;
};

function FloatingTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const theme = useAppTheme();
  const glass = theme.colors.liquidGlass;
  const { compactProgress } = useFloatingTabBar();
  const { width: windowWidth } = useWindowDimensions();
  const selectedTabAnimation = React.useRef(new Animated.Value(0)).current;
  const tabBarScaleAnimation = React.useRef(new Animated.Value(1)).current;
  const expandedTabBarWidth = Math.max(windowWidth - 56, 260);
  const compactTabBarWidth = Math.max(windowWidth * 0.54, 210);
  const tabBarWidth = interpolate(
    expandedTabBarWidth,
    compactTabBarWidth,
    compactProgress,
  );
  const selectedIconCircleWidth = interpolate(76, 58, compactProgress);
  const inactiveIconCircleWidth = interpolate(58, 44, compactProgress);
  const iconCircleHeight = 42;
  const iconSize = interpolate(28, 26, compactProgress);
  const visibleRoutes = state.routes.filter(isVisibleTabRoute);
  const tabBarSidePadding = (floatingTabBarHeight - iconCircleHeight) / 2;
  const tabButtonWidth = selectedIconCircleWidth;
  const getTabCenterX = (index: number): number => {
    if (index === 0) {
      return tabBarSidePadding + selectedIconCircleWidth / 2;
    }

    if (index === visibleRoutes.length - 1) {
      return tabBarWidth - tabBarSidePadding - selectedIconCircleWidth / 2;
    }

    return tabBarWidth / 2;
  };
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex(
      (route) => route.key === state.routes[state.index]?.key,
    ),
  );
  const selectedIndicatorTranslateX = selectedTabAnimation.interpolate({
    inputRange: visibleRoutes.map((_, index) => index),
    outputRange: visibleRoutes.map(
      (_, index) => getTabCenterX(index) - selectedIconCircleWidth / 2,
    ),
  });

  React.useEffect(() => {
    Animated.timing(selectedTabAnimation, {
      toValue: activeVisibleIndex,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeVisibleIndex, selectedTabAnimation]);

  const animateTabPress = (nextVisibleIndex: number) => {
    selectedTabAnimation.stopAnimation();
    tabBarScaleAnimation.stopAnimation();

    Animated.parallel([
      Animated.timing(selectedTabAnimation, {
        toValue: nextVisibleIndex,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(tabBarScaleAnimation, {
          toValue: 1.035,
          duration: 130,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tabBarScaleAnimation, {
          toValue: 1,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarOverlay,
        {
          bottom: floatingTabBarBottomOffset,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.floatingTabBar,
          {
            width: tabBarWidth,
            height: floatingTabBarHeight,
            borderColor: glass.borderColor,
            borderRadius: floatingTabBarHeight / 2,
            backgroundColor: glass.backgroundColor,
            transform: [{ scale: tabBarScaleAnimation }],
          },
          getPlatformGlassShadow(glass),
        ]}
      >
        <BlurView
          intensity={glass.blurIntensity}
          style={[
            styles.navBlurLayer,
            {
              borderRadius: floatingTabBarHeight / 2,
            },
          ]}
          tint={
            theme.scheme === "dark"
              ? "systemChromeMaterialDark"
              : "systemUltraThinMaterialLight"
          }
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selectedTabIndicator,
            {
              width: selectedIconCircleWidth,
              height: iconCircleHeight,
              borderRadius: iconCircleHeight / 2,
              backgroundColor: glass.selectedBackgroundColor,
              borderColor: glass.selectedBorderColor,
              transform: [{ translateX: selectedIndicatorTranslateX }],
            },
          ]}
        />
        {visibleRoutes.map((route, visibleRouteIndex) => {
          const routeIndex = state.routes.findIndex(
            (stateRoute) => stateRoute.key === route.key,
          );
          const focused = state.index === routeIndex;
          const iconName = tabIconNameByRoute[route.name];
          const options = descriptors[route.key].options;
          const accessibilityLabel =
            options.tabBarAccessibilityLabel ?? options.title ?? route.name;
          const color = focused
            ? theme.colors.primary
            : glass.inactiveIconColor;

          return (
            <Pressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="button"
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (process.env.EXPO_OS === "ios") {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }

                if (!focused && !event.defaultPrevented) {
                  animateTabPress(visibleRouteIndex);
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: route.name,
                      params: route.params,
                    }),
                  );
                }
              }}
              style={[
                styles.tabButton,
                {
                  left: getTabCenterX(visibleRouteIndex) - tabButtonWidth / 2,
                  width: tabButtonWidth,
                  height: floatingTabBarHeight,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    width: inactiveIconCircleWidth,
                    height: iconCircleHeight,
                    borderRadius: iconCircleHeight / 2,
                  },
                  styles.transparentIconCircle,
                ]}
              >
                <IconSymbol size={iconSize} name={iconName} color={color} />
              </View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

function TabLayoutContent() {
  const { authToken, isHydratingSession } = useSession();

  if (!isHydratingSession && !authToken) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
        }}
      />
      <Tabs.Screen
        name="add-delivery"
        options={{
          title: "Add",
        }}
      />
      <Tabs.Screen
        name="all-deliveries"
        options={{
          title: "All",
        }}
      />
      <Tabs.Screen
        name="tomorrow-deliveries"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-delivery"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <FloatingTabBarProvider>
      <TabLayoutContent />
    </FloatingTabBarProvider>
  );
}

const styles = StyleSheet.create({
  tabBarOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  floatingTabBar: {
    alignItems: "center",
    borderTopWidth: 1,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 0,
  },
  navBlurLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  selectedTabIndicator: {
    borderWidth: 1,
    left: 0,
    position: "absolute",
    top: 6,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  transparentIconCircle: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
});
