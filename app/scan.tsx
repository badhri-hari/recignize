import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ActionButton,
  ActionsContainer,
  CardHeader,
  ContentCard,
  EmptyState,
  ScreenLayout,
} from "../components/PageComponents";

import InputModal from "../components/InputModal";

import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import {
  loadItemsMetadata,
  saveItemsMetadata,
  savePhotoToDataFolder,
} from "../lib/storage";

const ITEM_CARD_WIDTH = 280;
const ITEM_CARD_MARGIN_HORIZONTAL = 9;
const SNAP_INTERVAL = ITEM_CARD_WIDTH + 2 * ITEM_CARD_MARGIN_HORIZONTAL + 8;

export default function ScanScreen() {
  const router = useRouter();

  const [scannedItems, setScannedItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [navigated, setNavigated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_KEY = Constants.expoConfig?.extra?.OPENROUTER_API_KEY;
  const timerRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (navigated) {
        return;
      }

      return () => {
        timerRef.current = setTimeout(async () => {
          try {
            for (const item of scannedItems) {
              await FileSystem.deleteAsync(item.uri, { idempotent: true });
            }

            setScannedItems([]);
            await saveItemsMetadata([]);
          } catch (e) {
            console.warn("Error during delayed cleanup:", e);
          }
          timerRef.current = null;
        }, 5000);
      };
    }, [scannedItems])
  );

  useEffect(() => {
    const init = async () => {
      const items = await loadItemsMetadata();
      setScannedItems(items);
    };
    init();
  }, []);

  const imageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  };

  const processImageWithAI = async (imageUri) => {
    try {
      setIsProcessing(true);

      const base64Image = await imageToBase64(imageUri);
      if (!base64Image) {
        throw new Error("Failed to convert image to base64");
      }

      const systemPrompt = `
You are an AI food item identifier. Your job is to identify food items in images and return JSON with:
- "name": The food item's name (simple, 1-3 words)
- "description": A brief description (optional, one short sentence)

Return ONLY valid JSON with these two fields. No other text.`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistralai/mistral-small-3.1-24b-instruct:free",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "What food item is in this image? Respond with JSON only.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content;

      try {
        const cleanedContent = aiContent
          .replace(/^```json\s*/i, "")
          .replace(/```$/, "")
          .trim();

        const result = JSON.parse(cleanedContent);
        return {
          name: result.name || "",
          description: result.description || "",
        };
      } catch (jsonError) {
        console.warn("Error parsing AI response:", jsonError);
        // Try to extract name using regex as fallback
        const nameMatch = aiContent.match(/"name"\s*:\s*"([^"]+)"/);
        const descMatch = aiContent.match(/"description"\s*:\s*"([^"]+)"/);

        return {
          name: nameMatch ? nameMatch[1] : "",
          description: descMatch ? descMatch[1] : "",
        };
      }
    } catch (error) {
      console.error("AI processing error:", error);
      return { name: "", description: "" };
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const savedUri = await savePhotoToDataFolder(result.assets[0].uri);
      setCurrentImage(savedUri);

      try {
        const aiResult = await processImageWithAI(savedUri);

        setItemName(aiResult.name);
        setItemDescription(aiResult.description);
      } catch (error) {
        console.warn("Error processing with AI:", error);
      } finally {
        setModalVisible(true);
      }
    }
  };

  const saveItem = async () => {
    const newItem = {
      id: Date.now().toString(),
      uri: currentImage,
      name: itemName,
      description: itemDescription,
    };

    const updatedItems = [...scannedItems, newItem];
    setScannedItems(updatedItems);
    await saveItemsMetadata(updatedItems);

    setModalVisible(false);
    setCurrentImage(null);
    setItemName("");
    setItemDescription("");
  };

  const toggleConfirmRemove = async (id) => {
    const item = scannedItems.find((i) => i.id === id);
    if (!item) return;

    if (confirmRemoveId === id) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
      } catch (e) {
        console.warn("Failed to delete image:", e);
      }

      const updatedItems = scannedItems.filter((i) => i.id !== id);
      setScannedItems(updatedItems);
      await saveItemsMetadata(updatedItems);
      setConfirmRemoveId(null);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setConfirmRemoveId(id);
    }
  };

  const handleScrollOrBackgroundPress = () => {
    if (confirmRemoveId) setConfirmRemoveId(null);
  };

  return (
    <ScreenLayout
      continueButtonColor="rgba(255, 221, 0, 1)"
      continueAllowed={scannedItems.length > 0}
      onContinue={() => {
        router.push("/add");
        setNavigated(true);
      }}
    >
      <ContentCard>
        <CardHeader
          iconName="camera"
          iconColor="rgba(255, 221, 0, 1)"
          title="Scan items using camera"
          subtitle="Automatically scan your inventory"
        />

        <View style={styles.itemsContainer}>
          {scannedItems.length === 0 ? (
            <EmptyState message="No items scanned yet. Scan items by clicking on the button below!" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.horizontalScrollContent}
              pagingEnabled
              snapToAlignment="center"
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
            >
              {scannedItems.map((item) => (
                <TouchableOpacity
                  activeOpacity={1}
                  key={item.id}
                  onPress={handleScrollOrBackgroundPress}
                >
                  <View style={styles.itemCard}>
                    <View style={styles.itemTopBar}>
                      <View style={styles.aiLabelContainer}>
                        <Text style={styles.aiLabel}>AI</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleConfirmRemove(item.id)}
                      >
                        <View
                          style={[
                            styles.removeButton,
                            confirmRemoveId === item.id &&
                              styles.removeButtonActive,
                          ]}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemLabelContainer}>
                      <Text style={styles.itemLabel}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      ) : (
                        ""
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <ActionsContainer>
          <ActionButton
            title="Capture items"
            onPress={() => {
              takePhoto();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            buttonColor="rgba(255, 221, 0, 1)"
            fullWidth={true}
          />
        </ActionsContainer>
      </ContentCard>

      <Modal transparent={true} visible={isProcessing} animationType="fade">
        <View style={styles.loaderContainer}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="rgba(255, 221, 0, 1)" />
            <Text style={styles.loaderText}>Analyzing image...</Text>
          </View>
        </View>
      </Modal>

      <InputModal
        visible={modalVisible}
        title="Item Details"
        name={itemName}
        description={itemDescription}
        onChangeName={setItemName}
        onChangeDescription={setItemDescription}
        onSave={saveItem}
        onCancel={() => {
          setModalVisible(false);
          setCurrentImage(null);
          setItemName("");
          setItemDescription("");
        }}
        showImage={
          currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
                marginBottom: 15,
              }}
            />
          ) : null
        }
        saveButtonColor="rgba(255, 221, 0, 1)"
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  itemsContainer: {
    flex: 1,
    width: "109.5%",
    marginLeft: -16,
    marginBottom: 12,
  },
  horizontalScrollContent: {
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  itemCard: {
    width: ITEM_CARD_WIDTH,
    marginHorizontal: ITEM_CARD_MARGIN_HORIZONTAL,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  itemTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 13,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  aiLabelContainer: {
    backgroundColor: "rgba(159, 159, 159, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  aiLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 100,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonActive: {
    backgroundColor: "#ff3b30",
  },
  itemImage: {
    height: "100%",
    resizeMode: "cover",
  },
  itemLabelContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemLabel: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "600",
  },
  itemDesc: {
    fontSize: 18,
    marginTop: 4.5,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loaderContent: {
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  loaderText: {
    color: "#fff",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
  },
});
