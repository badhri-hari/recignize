import { ContentCard, ScreenLayout } from "@/components/PageComponents";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LoadingBar from "../components/LoadingBar";

const { REACT_NATIVE_BACKEND_URL } = Constants.expoConfig?.extra ?? {};

type Recipe = {
  title: string;
  ingredients: string[];
  instructions: string;
};

function ErrorScreen({ code, message }: { code: number; message: string }) {
  const router = useRouter();
  return (
    <ImageBackground
      source={require("../assets/images/polka-dot-background.png")}
      style={styles.background}
      imageStyle={{ overflow: "hidden" }}
    >
      <View style={styles.errorContainer}>
        <Text style={styles.title}>{code}</Text>
        <Text style={styles.subtitle}>{message}</Text>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.replace("/")}
        >
          <Text
            style={styles.continueButtonText}
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            GO BACK HOME
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

export default function ResultsScreen() {
  const [showBar, setShowBar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<{ code: number; message: string } | null>(
    null
  );

  const router = useRouter();

  const params = useLocalSearchParams();
  const itemsParam = params.items as string | undefined;

  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    (async () => {
      try {
        if (!itemsParam) throw new Error("No items provided");

        const parsed = JSON.parse(decodeURIComponent(itemsParam));
        const resp = await fetch(REACT_NATIVE_BACKEND_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: parsed }),
        });

        if (!resp.ok) {
          const errorData = await resp.json();
          const status = resp.status;
          const message = errorData.error || `Server responded with ${status}`;
          throw { status, message };
        }

        const result = await resp.json();
        if (Array.isArray(result.recipes)) {
          setRecipes(result.recipes);
          setError(null);
        } else {
          throw {
            status: 500,
            message: "Invalid AI response format.",
          };
        }
      } catch (err: any) {
        console.error(err);
        setError({
          code: err.status || 500,
          message: err.message || "Unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    })();

    const barTimer = setTimeout(() => {
      setShowBar(false);
    }, 8000);

    return () => clearTimeout(barTimer);
  }, [itemsParam]);

  useEffect(() => {
    if (!showBar) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [showBar, fadeAnim]);

  if (showBar) {
    return <LoadingBar />;
  }

  if (loading) {
    return (
      <ScreenLayout
        continueButtonColor="rgba(255, 221, 0, 1)"
        continueAllowed={true}
        onContinue={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <ContentCard>
          <Text style={styles.screenTitle}>RESULTS</Text>
          <ScrollView style={styles.itemsContainer}>
            {[...Array(1)].map((_, i) => (
              <Animated.View
                key={i}
                style={[styles.skeletonCard, { opacity: pulseAnim }]}
              >
                <View style={styles.skelImage} />
                <View style={styles.skelLineShort} />
                <View style={styles.skelLineLong} />
                <View style={styles.skelLineMedium} />
              </Animated.View>
            ))}
          </ScrollView>
        </ContentCard>
      </ScreenLayout>
    );
  }

  if (error) {
    return <ErrorScreen code={error.code} message={error.message} />;
  }

  return (
    <ScreenLayout
      continueButtonColor="rgba(255, 221, 0, 1)"
      continueAllowed={true}
      onContinue={() => {
        router.replace("/");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <ContentCard>
        <Text style={styles.screenTitle}>RESULTS</Text>
        <ScrollView style={styles.itemsContainer}>
          {recipes.map((r, idx) => (
            <View key={idx} style={styles.recipeCard}>
              <View style={styles.resultImagePlaceholder} />
              <Text style={styles.recipeTitle}>{r.title}</Text>
              <Text style={styles.sectionHeader}>Ingredients:</Text>
              {r.ingredients.map((ing, i) => (
                <Text key={i} style={styles.ingredient}>
                  • {ing}
                </Text>
              ))}
              <Text style={styles.sectionHeader}>Instructions:</Text>
              {r.instructions
                .split(/\d+\.\s+/)
                .filter((step) => step.trim().length > 0)
                .map((step, i) => (
                  <Text key={i} style={styles.instructions}>
                    {`${i + 1}. ${step.trim()}`}
                  </Text>
                ))}
            </View>
          ))}
        </ScrollView>
      </ContentCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  skeletonCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  skelImage: {
    height: 120,
    borderRadius: 8,
    backgroundColor: "#333",
    marginBottom: 12,
  },
  skelLineShort: {
    height: 14,
    width: "40%",
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
  },
  skelLineLong: {
    height: 14,
    width: "80%",
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 6,
  },
  skelLineMedium: {
    height: 14,
    width: "60%",
    backgroundColor: "#333",
    borderRadius: 4,
  },
  title: {
    fontFamily: "ConfigSemiBold",
    fontSize: 60,
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 5,
  },
  subtitle: {
    fontFamily: "ConfigSemiBold",
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#181818",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 20,
  },
  continueButtonText: {
    fontFamily: "ConfigSemiBold",
    color: "#fff",
    fontSize: 25,
  },
  itemsContainer: {
    flex: 1,
    height: 0,
    marginBottom: 12,
  },
  screenTitle: {
    fontFamily: "ConfigSemiBold",
    fontSize: 19,
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 4,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 35,
  },
  recipeCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderColor: "rgba(150, 150, 150, 0.5)",
    borderWidth: 0.5,
  },
  resultImagePlaceholder: {
    height: 160,
    backgroundColor: "#333",
    borderRadius: 8,
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 221, 0, 1)",
    marginTop: 10,
    marginBottom: 5,
  },
  ingredient: {
    color: "#ccc",
    marginLeft: 10,
    marginBottom: 2,
  },
  instructions: {
    marginTop: 5,
    color: "#ddd",
  },
});
