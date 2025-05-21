import { useFonts } from "expo-font";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    ConfigSemiBold: require("../assets/fonts/config-alt/ConfigAltSemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={require("../assets/images/polka-dot-background.png")}
      style={styles.background}
      imageStyle={{
        overflow: "hidden",
      }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Page Not Found</Text>
        <Text style={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>

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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontFamily: "ConfigSemiBold",
    fontSize: 60,
    color: "#fff",
    marginBottom: 10,
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
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 10,
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
  },
  continueButtonText: {
    fontFamily: "ConfigSemiBold",
    color: "#fff",
    fontSize: 25,
  },
});
