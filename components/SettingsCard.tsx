import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SettingsCardProps {
  iconName: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  backgroundColor?: string;
  iconColor?: string;
}

export default function SettingsCard({
  iconName,
  title,
  subtitle,
  onPress,
  backgroundColor = "#181818",
  iconColor = "#fff",
}: SettingsCardProps) {
  return (
    <Pressable style={[styles.card, { backgroundColor }]} onPress={onPress}>
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
    paddingVertical: 16,
    paddingHorizontal: 5,
    borderRadius: 14,
    alignItems: "center",
  },
  iconContainer: {
    width: 55,
    height: 55,
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
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14.5,
    marginTop: 3.5,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
});
