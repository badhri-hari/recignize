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
            onPress={() => {
              router.replace("/");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
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
  const API_KEY = Constants.expoConfig?.extra?.OPENROUTER_API_KEY;

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
      let raw = "";
      try {
        if (!itemsParam) throw new Error("No items provided");
        const parsedItems: string[] = JSON.parse(
          decodeURIComponent(itemsParam)
        );

        const systemPrompt = `
You are a JSON recipe generator. Based on the user's items, return as many unique recipes as possible using different combinations of the items. Each recipe must be a valid JSON object with these exact keys:
- "title": string (a catchy name)
- "ingredients": string[] (only the ingredients used for this recipe)
- "instructions": string (multi-step instructions, with each step numbered like '1. Do this.', '2. Then this.', etc.)

Respond ONLY with a single JSON array of recipe objects. Do NOT include any other text. Each recipe can use a subset of the items—do NOT try to use all items in every recipe.
`.trim();

        const userPrompt = `Here is a list of available items:\n${JSON.stringify(
          parsedItems,
          null,
          2
        )}\n\nPlease generate as many valid and creative recipe combinations as possible. Each recipe should use a subset of the ingredients.`;

        const aiResp = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "meta-llama/llama-4-maverick:free",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
          }
        );

        if (!aiResp.ok) {
          const err = await aiResp.json();
          throw {
            status: aiResp.status,
            message: err.error?.message || `HTTP ${aiResp.status}`,
          };
        }

        const payload = await aiResp.json();
        raw = payload.choices?.[0]?.message?.content || "";

        if (!raw.trim()) {
          throw new Error("Received empty response from OpenRouter");
        }

        const cleaned = raw
          .replace(/^```json\s*/i, "")
          .replace(/```$/, "")
          .trim();

        let parsed: Recipe[] = JSON.parse(cleaned);

        setRecipes(parsed);
        setError(null);
      } catch (e: any) {
        console.warn("AI fetch or parse error:", e);

        const debugInstructions =
          raw ||
          (e.message && e.message.includes("AI output was:")
            ? e.message.split("AI output was:\n")[1]
            : undefined);

        if (debugInstructions) {
          setRecipes([
            {
              title: "🔍 Raw AI Output (for debugging)",
              ingredients: [],
              instructions: debugInstructions.trim(),
            },
          ]);
          setError(null);
        } else {
          setError({
            code: e.status || 500,
            message: e.message || "Unexpected error occurred",
          });
        }
      } finally {
        setLoading(false);
        setShowBar(false);
      }
    })();
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

  // Helper function to parse and display instructions line by line
  const renderInstructions = (instructions: string) => {
    // Check if we're dealing with debug output
    if (instructions.startsWith("{") || instructions.startsWith("[")) {
      return <Text style={styles.instructions}>{instructions}</Text>;
    }

    // Split instructions by numbered pattern (1. 2. 3. etc.)
    const steps = instructions
      .split(/(\d+\.\s)/)
      .filter(Boolean) // Remove empty strings
      .reduce((acc: string[], current, index, array) => {
        // If this is a number like "1. ", combine with the next item
        if (/^\d+\.\s$/.test(current) && index < array.length - 1) {
          acc.push(current + array[index + 1]);
        } else if (!/^\d+\.\s$/.test(array[index - 1])) {
          // Only add non-number items if they're not already combined
          acc.push(current);
        }
        return acc;
      }, []);

    return steps.map((step, idx) => {
      // Skip lines that don't start with a number if not the first item
      if (idx > 0 && !/^\d+\./.test(step)) return null;
      return (
        <Text key={idx} style={styles.instruction}>
          {step.trim()}
        </Text>
      );
    });
  };

  if (showBar) return <LoadingBar />;

  if (loading)
    return (
      <ScreenLayout
        continueButtonColor="rgba(255, 221, 0, 1)"
        continueAllowed
        onContinue={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      >
        <ContentCard>
          <Text style={styles.screenTitle}>RESULTS</Text>
          <ScrollView style={styles.itemsContainer}>
            <Animated.View
              style={[styles.skeletonCard, { opacity: pulseAnim }]}
            >
              <View style={styles.skelLineShort} />
              <View style={styles.skelLineLong} />
              <View style={styles.skelLineMedium} />
            </Animated.View>
          </ScrollView>
        </ContentCard>
      </ScreenLayout>
    );

  if (error) return <ErrorScreen code={error.code} message={error.message} />;

  return (
    <ScreenLayout
      continueButtonColor="rgba(255, 221, 0, 1)"
      continueAllowed
      onContinue={() => {
        router.replace("/");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <ContentCard>
        <Text style={styles.screenTitle}>RESULTS</Text>
        <ScrollView style={styles.itemsContainer}>
          {recipes.map((r, i) => (
            <Animated.View
              key={i}
              style={[styles.recipeCard, { opacity: fadeAnim }]}
            >
              <Text style={styles.recipeTitle}>{r.title}</Text>
              {r.ingredients.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Ingredients:</Text>
                  {r.ingredients.map((ing, idx) => (
                    <Text key={idx} style={styles.ingredient}>
                      • {ing}
                    </Text>
                  ))}
                </>
              )}
              <Text style={styles.sectionHeader}>Instructions:</Text>
              <View style={styles.instructionsContainer}>
                {renderInstructions(r.instructions)}
              </View>
            </Animated.View>
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
  errorContainer: { padding: 32, alignItems: "center", width: "100%" },
  skeletonCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    margin: 20,
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
  screenTitle: {
    fontFamily: "ConfigSemiBold",
    fontSize: 19,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 35,
  },
  recipeCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderColor: "rgba(150,150,150,0.5)",
    borderWidth: 0.5,
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
    color: "rgba(255,221,0,1)",
    marginTop: 10,
    marginBottom: 5,
  },
  ingredient: { color: "#ccc", marginLeft: 10, marginBottom: 2 },
  instructionsContainer: { marginTop: 5 },
  instruction: { color: "#ddd", marginBottom: 8 },
  instructions: { marginTop: 5, color: "#ddd" }, // Kept for backward compatibility
  continueButton: {
    backgroundColor: "#181818",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
    marginTop: 20,
  },
  continueButtonText: {
    fontFamily: "ConfigSemiBold",
    fontSize: 25,
    color: "#fff",
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
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
    textAlign: "center",
  },
  itemsContainer: { flex: 1, height: 0, marginBottom: 12 },
});
