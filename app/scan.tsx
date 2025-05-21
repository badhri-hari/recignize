import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setModalVisible(true);
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
});
