import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinOffset = useRef(0);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isSpinning) {
      spinValue.setValue(spinOffset.current);

      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: spinOffset.current + 1,
          duration: 30000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    }

    return () => {
      animation?.stop();
    };
  }, [isSpinning, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    spinValue.stopAnimation((value) => {
      spinOffset.current = value % 1;
      setIsSpinning(false);
    });
  };

  const handlePressOut = () => {
    setIsSpinning(true);
  };

  const GoogleButton = () => (
    <TouchableOpacity style={styles.signInButton} activeOpacity={0.55}>
      <View style={styles.buttonContent}>
        <Ionicons
          style={[styles.buttonIcon, { top: -1, left: -76 }]}
          name="logo-google"
          size={22}
          color="rgba(255, 255, 255, 0.85)"
        />
        <Text style={styles.buttonText}>SIGN IN VIA GOOGLE</Text>
      </View>
    </TouchableOpacity>
  );

  const AppleButton = () => (
    <TouchableOpacity style={styles.signInButton} activeOpacity={0.55}>
      <View style={styles.buttonContent}>
        <Ionicons
          style={[styles.buttonIcon, { top: -4, left: -82 }]}
          name="logo-apple"
          size={26}
          color="rgba(255, 255, 255, 0.85)"
        />
        <Text style={styles.buttonText}>SIGN IN VIA APPLE</Text>
      </View>
    </TouchableOpacity>
  );

  const isIOS = Platform.OS === "ios";

  return (
    <>
      <View style={styles.topBar} />

      <View style={styles.container}>
        <StatusBar style="light" />

        <Pressable onLongPress={handleLongPress} onPressOut={handlePressOut}>
          <Animated.Image
            source={require("../assets/images/login-logo.webp")}
            style={[styles.logo, { transform: [{ rotate: spin }] }]}
          />
        </Pressable>

        <View style={styles.welcomeContainer}>
          <Text style={styles.helloText}>
            Hello <Text style={styles.highlightText}>there</Text>!
          </Text>
          <Text style={styles.subtitleText}>Let&apos;s get you signed in.</Text>
        </View>

        <View style={styles.buttonsContainer}>
          {isIOS ? (
            <>
              <AppleButton />
              <GoogleButton />
            </>
          ) : (
            <>
              <GoogleButton />
              <AppleButton />
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 20,
  },
  topBar: {
    height: 38,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 1)",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  logo: {
    position: "absolute",
    top: -150,
    left: 130,
    width: 500,
    height: 500,
  },
  welcomeContainer: {
    marginTop: "auto",
    marginBottom: 28,
  },
  helloText: {
    letterSpacing: 0.5,
    fontSize: 50,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  highlightText: {
    color: "#FFD700",
  },
  subtitleText: {
    letterSpacing: 0,
    fontWeight: "500",
    fontSize: 20,
    color: "#AAAAAA",
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 60,
  },
  signInButton: {
    backgroundColor: "#1A1A1A",
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "solid",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    position: "absolute",
  },
  buttonText: {
    fontFamily: "ConfigSemiBold",
    fontWeight: "700",
    letterSpacing: 0,
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 18,
  },
});
