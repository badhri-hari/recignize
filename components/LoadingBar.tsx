import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function LoadingBar() {
  const progress = React.useRef(new Animated.Value(0)).current;

  const customEasing = (t: number) => {
    if (t < 0.7) {
      return t * 1.1;
    } else if (t < 0.98) {
      return 0.65 + (t - 0.7) * 0.65;
    } else {
      const denominator = 1.01 - t;
      return denominator > 0 ? 0.96 + (t - 0.96) * 0.1 * (1 / denominator) : 1;
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
        easing: customEasing,
      }),
    ]).start();
  }, [progress]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.loadingBarScreen}>
      <View style={styles.loadingBarContainer}>
        <Animated.View
          style={[styles.loadingBarFill, { width: widthInterpolated }]}
        />
        <Text style={styles.loadingBarText}>GENERATING...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBarScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingBarContainer: {
    flexDirection: "row",
    height: 48,
    width: "85%",
    backgroundColor: "#111",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "rgba(150, 150, 150, 0.5)",
  },
  loadingBarFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E91E63",
  },
  loadingBarText: {
    fontFamily: "ConfigSemiBold",
    letterSpacing: 0,
    fontSize: 20,
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
  },
});
