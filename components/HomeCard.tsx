import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface HomeCardProps {
  iconName: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  backgroundColor?: string;
  iconColor?: string;
}

export default function HomeCard({
  iconName,
  title,
  subtitle,
  onPress,
  backgroundColor = "#181818",
  iconColor = "#fff",
}: HomeCardProps) {
  return (
    <Pressable
      style={[styles.card, { backgroundColor }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: "rgba(255, 255, 255, 0.1)" },
        ]}
      >
        <Ionicons name={iconName as any} size={32} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginVertical: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "solid",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 0.25,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderStyle: "solid",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14.5,
    marginTop: 3.5,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
});
