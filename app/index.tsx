import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import HomeCard from "../components/HomeCard";
import SettingsCard from "../components/SettingsCard";

export default function HomeScreen() {
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
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.title}>RECIGNIZE</Text>

        <HomeCard
          iconName="add-circle"
          iconColor="rgba(255, 57, 176, 1)"
          title="Add items manually"
          subtitle="Tell us what you got?"
          onPress={() => router.push("/add")}
          backgroundColor="#181818"
        />

        <HomeCard
          iconName="camera"
          iconColor="rgba(255, 221, 0, 1)"
          title="Scan items using camera"
          subtitle="Automatically scan your inventory"
          onPress={() => router.push("/scan")}
          backgroundColor="#181818"
        />

        <HomeCard
          iconName="archive"
          iconColor="rgba(255, 116, 62, 1)"
          title="Fetch a saved list"
          subtitle="Fetch your saved inventory :P"
          onPress={() => router.push("/lists")}
          backgroundColor="#181818"
        />

        <View style={styles.divider}></View>

        <View style={styles.settingsContainer} pointerEvents="none">
          <Text style={styles.settingsTitle}>SETTINGS</Text>

          <SettingsCard
            iconName="person-circle"
            iconColor="#ffffff"
            title="Your profile"
            subtitle="Name, Age, Nationality, etc."
            onPress={() => router.push("/profile")}
            backgroundColor="#181818"
          />

          <SettingsCard
            iconName="list-circle"
            iconColor="#ffffff"
            title="Saved lists"
            subtitle="Inventory, utensils, appliances, etc."
            onPress={() => router.push("/saved")}
            backgroundColor="#181818"
          />

          <SettingsCard
            iconName="shield-checkmark"
            iconColor="#ffffff"
            title="Privacy Policy"
            subtitle="Terms, conditions, data sharing, etc."
            onPress={() => router.push("/privacy")}
            backgroundColor="#181818"
          />

          <SettingsCard
            iconName="paper-plane"
            iconColor="#ffffff"
            title="Check our socials!"
            subtitle="Follow us to stay updated!"
            onPress={() => router.push("/socials")}
            backgroundColor="#181818"
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontFamily: "ConfigSemiBold",
    fontSize: 22,
    letterSpacing: 9,
    color: "#fff",
    textAlign: "center",
    marginTop: 48,
    marginBottom: 24,
  },
  divider: {
    height: 5,
    backgroundColor: "rgba(189, 189, 189, 0.25)",
    marginTop: 10,
    width: "25%",
    alignSelf: "center",
    borderRadius: 100,
  },
  settingsContainer: {
    backgroundColor: "#181818",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 50,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "solid",
  },
  settingsTitle: {
    fontFamily: "ConfigSemiBold",
    fontStyle: "normal",
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 20,
  },
});
