import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export const ScreenLayout = ({
  children,
  continueButtonColor,
  onContinue,
  continueAllowed = false,
}) => {
  const router = useRouter();
  const [opacity] = useState(new Animated.Value(continueAllowed ? 1 : 0.4));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: continueAllowed ? 1 : 0.4,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [continueAllowed, opacity]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>RECIGNIZE</Text>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <View style={styles.bottomActionRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.back();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <MaterialCommunityIcons
            name="arrow-u-left-top"
            size={26}
            color={continueButtonColor || "rgba(255, 57, 176, 1)"}
          />
        </TouchableOpacity>

        <Animated.View style={{ flex: 1, opacity }}>
          <TouchableOpacity
            disabled={!continueAllowed}
            style={[
              styles.continueButton,
              {
                backgroundColor: continueButtonColor || "rgba(255, 57, 176, 1)",
              },
            ]}
            onPress={
              onContinue
                ? () => {
                    onContinue();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                : () => router.back()
            }
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export const ContentCard = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

export const CardHeader = ({ iconName, iconColor, title, subtitle }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerIconContainer}>
      <Ionicons name={iconName} size={30} color={iconColor} />
    </View>
    <View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

export const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  onSubmitEditing,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (text) => {
    onChangeText(text.trimStart());
  };

  const handleSubmitEditing = () => {
    if (onSubmitEditing) {
      onSubmitEditing(value.trim());
    }
  };

  return (
    <View
      style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
    >
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Search items"}
        placeholderTextColor="#757575"
        maxLength={30}
        autoCapitalize="sentences"
        clearButtonMode="while-editing"
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export const EmptyState = ({ message }) => (
  <Text style={styles.emptyMessage}>{message}</Text>
);

export const ActionButton = ({
  title,
  onPress,
  buttonColor,
  fullWidth = true,
}) => (
  <TouchableOpacity
    style={[
      styles.addButton,
      { borderColor: buttonColor || "rgba(255, 57, 176, 1)" },
      fullWidth ? { flex: 1 } : {},
    ]}
    onPress={onPress}
  >
    <Text style={styles.addButtonText}>{title}</Text>
  </TouchableOpacity>
);

export const IconButton = ({ iconName, iconColor, onPress }) => (
  <TouchableOpacity
    style={[styles.bookmarkButton, { borderColor: iconColor }]}
    onPress={onPress}
  >
    <Ionicons name={iconName} size={20} color={iconColor} />
  </TouchableOpacity>
);

export const ActionsContainer = ({ children }) => (
  <View style={styles.actionsContainer}>{children}</View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 48,
  },
  title: {
    fontFamily: "ConfigSemiBold",
    fontSize: 22,
    letterSpacing: 9,
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 18,
    flex: 1,
    marginBottom: 20,
    borderWidth: 0.25,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderStyle: "solid",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 0.25,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderStyle: "solid",
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14.5,
    marginTop: 3.5,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "transparent",
    borderRadius: 8,
  },
  inputContainerFocused: {
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    color: "#fff",
    padding: 12,
    fontSize: 15,
  },
  emptyMessage: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 15,
    paddingVertical: 30,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    marginRight: 9,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  bookmarkButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 69,
    height: 69,
    borderRadius: 100,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  continueButton: {
    flex: 1,
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: "center",
  },
  continueButtonText: {
    fontFamily: "ConfigSemiBold",
    letterSpacing: 0,
    color: "#000",
    fontSize: 23,
  },
});
