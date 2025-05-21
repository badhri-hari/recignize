import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { loadItemsMetadata } from "../lib/storage";

import {
  ActionButton,
  ActionsContainer,
  CardHeader,
  ContentCard,
  EmptyState,
  IconButton,
  ScreenLayout,
  SearchInput,
} from "../components/PageComponents";

import InputModal from "../components/InputModal";

type Item = {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
};

export default function AddScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [listNameModalVisible, setListNameModalVisible] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState(false);

  const nameRef = useRef<TextInput>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchScannedItems = async () => {
      const scannedItems = await loadItemsMetadata();

      const formattedItems = scannedItems.map((item) => ({
        id: item.id,
        name: item.name || "Unnamed item",
        description: item.description || "",
        imageUri: item.uri || null,
      }));

      setItems(formattedItems);
    };

    fetchScannedItems();
  }, []);

  const ImageWithPlaceholder = ({ uri }: { uri: string }) => {
    const [loading, setLoading] = useState(true);

    return (
      <View style={styles.itemImage}>
        {loading && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="small" color="#888" />
          </View>
        )}

        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      </View>
    );
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName("");
    setItemDesc("");
    setModalVisible(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setModalVisible(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const saveItem = () => {
    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: itemName, description: itemDesc }
            : item
        )
      );
    } else {
      const newItem: Item = {
        id: Date.now().toString(),
        name: itemName,
        description: itemDesc,
      };
      setItems([...items, newItem]);
    }

    setModalVisible(false);
    setEditingItem(null);
    setItemName("");
    setItemDesc("");
  };

  const saveList = async () => {
    try {
      const listsPath = FileSystem.documentDirectory + "data/lists.json";

      const dirInfo = await FileSystem.getInfoAsync(
        FileSystem.documentDirectory + "data/"
      );
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(
          FileSystem.documentDirectory + "data/",
          {
            intermediates: true,
          }
        );
      }

      let existing = [];
      const fileInfo = await FileSystem.getInfoAsync(listsPath);

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(listsPath);
        existing = JSON.parse(content);
      }

      if (!listName.trim()) {
        alert("List name is required.");
        return;
      }

      const newList = {
        id: Date.now().toString(),
        name: listName.trim(),
        description: listDescription.trim(),
        timestamp: new Date().toISOString(),
        items,
      };

      existing.push(newList);

      await FileSystem.writeAsStringAsync(
        listsPath,
        JSON.stringify(existing, null, 2)
      );

      setListName("");
      setListDescription("");
      setListNameModalVisible(false);
      setPendingNavigation(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (pendingNavigation) {
        proceedToResults();
      }
    } catch (err) {
      console.error("Failed to save list:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const toggleConfirmRemove = (id: string) => {
    if (confirmRemoveId === id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setItems(items.filter((item) => item.id !== id));
      setConfirmRemoveId(null);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setConfirmRemoveId(id);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const proceedToResults = async () => {
    const itemsWithBase64 = await Promise.all(
      items.map(async (item) => {
        if (item.imageUri) {
          try {
            const base64 = await FileSystem.readAsStringAsync(item.imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            return {
              ...item,
              imageBase64: base64,
            };
          } catch (err) {
            console.warn(`Failed to read image for item ${item.id}:`, err);
            return { ...item };
          }
        }
        return item;
      })
    );

    const encodedItems = encodeURIComponent(JSON.stringify(itemsWithBase64));
    router.push(`/results?items=${encodedItems}`);
  };

  const handleContinuePress = async () => {
    if (isBookmarked) {
      setListNameModalVisible(true);
      setPendingNavigation(true);
      return;
    }

    proceedToResults();
  };

  return (
    <ScreenLayout
      continueButtonColor="rgba(255, 57, 176, 1)"
      continueAllowed={items.length > 0}
      onContinue={handleContinuePress}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          if (confirmRemoveId !== null) setConfirmRemoveId(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ContentCard>
            <CardHeader
              iconName="add-circle"
              iconColor="rgba(255, 57, 176, 1)"
              title="Add items manually"
              subtitle={
                items.length > 0
                  ? isBookmarked
                    ? "Bookmark enabled. Saving items as list."
                    : "Anything missing?"
                  : "Tell us what you got?"
              }
            />

            <SearchInput
              placeholder="Search items"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.itemsContainer}>
              {filteredItems.length === 0 ? (
                <EmptyState message="No items found. Add items by clicking on the button below!" />
              ) : (
                filteredItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() => {
                      openEditModal(item);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    {item.imageUri && (
                      <View style={styles.imageWrapper}>
                        <ImageWithPlaceholder uri={item.imageUri} />
                      </View>
                    )}

                    <View
                      style={{ flex: 1, marginLeft: item.imageUri ? 12 : 0 }}
                    >
                      <Text style={styles.itemText}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleConfirmRemove(item.id);
                      }}
                    >
                      <View
                        style={[
                          styles.removeButton,
                          confirmRemoveId === item.id &&
                            styles.removeButtonActive,
                        ]}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color="rgba(255, 255, 255, 0.6)"
                        />
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <ActionsContainer>
              <ActionButton
                title="Add items"
                onPress={() => {
                  openAddModal();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                buttonColor="rgba(255, 57, 176, 1)"
              />
              <View
                style={{
                  backgroundColor: isBookmarked
                    ? "rgba(255, 57, 176, 0.25)"
                    : "transparent",
                  borderRadius: 100,
                }}
              >
                <IconButton
                  iconName={isBookmarked ? "bookmark" : "bookmark-outline"}
                  iconColor={"rgba(255, 57, 176, 1)"}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsBookmarked(!isBookmarked);
                  }}
                />
              </View>
            </ActionsContainer>
          </ContentCard>

          <InputModal
            visible={modalVisible}
            title={editingItem ? "Edit Item" : "Add Item"}
            name={itemName}
            description={itemDesc}
            onChangeName={setItemName}
            onChangeDescription={setItemDesc}
            onSave={saveItem}
            onCancel={() => {
              setModalVisible(false);
              setEditingItem(null);
              setItemName("");
              setItemDesc("");
            }}
            saveButtonColor="rgba(255, 57, 176, 1)"
          />

          {isBookmarked && (
            <InputModal
              visible={listNameModalVisible}
              title="Save New List"
              name={listName}
              description={listDescription}
              onChangeName={setListName}
              onChangeDescription={setListDescription}
              onSave={saveList}
              onCancel={() => {
                setListNameModalVisible(false);
                setListName("");
                setListDescription("");
              }}
              saveButtonColor="rgba(255, 116, 62, 1)"
            />
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  itemsContainer: {
    flex: 1,
    height: 0,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 13,
    paddingRight: 15,
    marginBottom: 9,
    justifyContent: "space-between",
  },
  imageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  itemImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    backgroundColor: "#444",
    borderRadius: 8,
  },
  itemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  itemDesc: {
    fontSize: 13.5,
    marginTop: 3.5,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.4)",
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
  saveButton: {
    backgroundColor: "rgba(255, 57, 176, 1)",
    marginLeft: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15.5,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 15.5,
  },
});
