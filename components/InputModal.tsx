import React, { useEffect, useRef } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface InputModalProps {
  visible: boolean;
  title: string;
  name: string;
  description: string;
  onChangeName: (text: string) => void;
  onChangeDescription: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  namePlaceholder?: string;
  descPlaceholder?: string;
  showImage?: React.ReactNode;
  saveButtonColor?: string;
}

export default function InputModal({
  visible,
  title,
  name,
  description,
  onChangeName,
  onChangeDescription,
  onSave,
  onCancel,
  namePlaceholder = "Item Name",
  descPlaceholder = "Description (optional)",
  showImage,
  saveButtonColor = "rgba(255, 221, 0, 1)",
}: InputModalProps) {
  const nameInputRef = useRef<TextInput>(null);
  const descInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
          accessible={false}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{title}</Text>

              {showImage}

              <TextInput
                ref={nameInputRef}
                style={styles.input}
                placeholder={namePlaceholder}
                placeholderTextColor="#757575"
                maxLength={30}
                clearButtonMode="while-editing"
                autoFocus
                value={name}
                onChangeText={onChangeName}
                returnKeyType="next"
                onSubmitEditing={() => descInputRef.current?.focus()}
              />

              <TextInput
                ref={descInputRef}
                style={styles.input}
                placeholder={descPlaceholder}
                placeholderTextColor="#757575"
                maxLength={30}
                clearButtonMode="while-editing"
                returnKeyType="done"
                value={description}
                onChangeText={onChangeDescription}
                onSubmitEditing={() => {
                  const trimmedName = name.trim();
                  const trimmedDesc = description.trim();

                  if (!trimmedName) {
                    Alert.alert(
                      "Name required",
                      "Please enter a name for this item"
                    );
                    return;
                  }

                  onChangeName(trimmedName);
                  onChangeDescription(trimmedDesc);
                  onSave();
                }}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: saveButtonColor, marginLeft: 10 },
                  ]}
                  onPress={() => {
                    const trimmedName = name.trim();
                    const trimmedDesc = description.trim();

                    if (!trimmedName) {
                      Alert.alert(
                        "Name required",
                        "Please enter a name for this item"
                      );
                      return;
                    }

                    onChangeName(trimmedName);
                    onChangeDescription(trimmedDesc);
                    onSave();
                  }}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#232323",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14.5,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15.5,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15.5,
  },
});
