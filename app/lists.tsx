import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CardHeader,
  ContentCard,
  EmptyState,
  ScreenLayout,
  SearchInput,
} from "../components/PageComponents";

type ListType = {
  id: string;
  name: string;
  subtitle: string;
  items: { id: string; name: string }[];
};

const listsPath = FileSystem.documentDirectory + "data/lists.json";

export default function ListsScreen() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [lists, setLists] = useState<ListType[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedLists = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(listsPath);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(listsPath);
          const parsedLists = JSON.parse(content);
          const formattedLists: ListType[] = parsedLists.map((list: any) => ({
            id: list.id,
            name: list.name,
            subtitle: list.description ?? "",
            items: list.items.map((item: any, idx: number) => ({
              id: `${list.id}-${idx}`,
              name: `${item.name}${
                item.description ? " - " + item.description : ""
              }`,
            })),
          }));
          setLists(formattedLists);
        }
      } catch (err) {
        console.error("Failed to load saved lists:", err);
      }
    };
    loadSavedLists();
  }, []);

  const handleListSelection = (id: string) => {
    if (selectedListId === id) {
      setSelectedListId(null);
    } else {
      setSelectedListId(id);
    }
  };

  const saveUpdatedLists = async (updatedLists: ListType[]) => {
    try {
      const listsToSave = updatedLists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.subtitle,
        items: list.items.map((item) => {
          const [name, ...descParts] = item.name.split(" - ");
          return { name, description: descParts.join(" - ") || null };
        }),
      }));
      await FileSystem.writeAsStringAsync(
        listsPath,
        JSON.stringify(listsToSave)
      );
    } catch (err) {
      console.error("Failed to save updated lists:", err);
    }
  };

  const handleRemove = async (id: string) => {
    if (confirmRemoveId === id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const updatedLists = lists.filter((l) => l.id !== id);
      setLists(updatedLists);
      setConfirmRemoveId(null);
      await saveUpdatedLists(updatedLists);
      if (selectedListId === id) {
        setSelectedListId(null);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setConfirmRemoveId(id);
    }
  };

  const handleBackgroundPress = () => {
    if (confirmRemoveId) {
      setConfirmRemoveId(null);
    }
    Keyboard.dismiss();
  };

  const filteredLists = lists.filter((list) =>
    list.name?.toLowerCase().includes(searchInput.toLowerCase())
  );

  const selectedList = lists.find((list) => list.id === selectedListId);

  return (
    <Pressable style={{ flex: 1 }} onPress={handleBackgroundPress}>
      <ScreenLayout
        continueButtonColor="rgba(255, 116, 62, 1)"
        continueAllowed={selectedListId !== null}
        onContinue={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (selectedList) {
            router.replace({
              pathname: "/results",
              params: {
                listName: selectedList.name,
                items: JSON.stringify(selectedList.items),
              },
            });
          }
        }}
      >
        <ContentCard>
          <CardHeader
            iconName="archive"
            iconColor="rgba(255, 116, 62, 1)"
            title="Fetch a saved list"
            subtitle="Fetch your saved inventory :P"
          />
          <SearchInput
            placeholder="Search lists"
            value={searchInput}
            onChangeText={setSearchInput}
          />
          <ScrollView
            style={styles.itemsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {filteredLists.length === 0 ? (
              <EmptyState message="No lists found. Create lists by going to the 'Add items' screen and clicking on the bookmark button." />
            ) : (
              filteredLists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.listContainer,
                    selectedListId === list.id && styles.selectedListContainer,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleListSelection(list.id);
                  }}
                >
                  <View style={styles.itemDetails}>
                    <View>
                      <Text style={styles.listTitle}>{list.name}</Text>
                      {list.subtitle ? (
                        <Text style={styles.listSubtitle}>{list.subtitle}</Text>
                      ) : null}
                    </View>
                    <View style={styles.listItemsView}>
                      {list.items.map((item) => (
                        <View key={item.id} style={styles.listItemRow}>
                          <View style={styles.bullet} />
                          <Text style={styles.listItemText}>{item.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemove(list.id);
                    }}
                    style={({ pressed }) => [
                      styles.removeButton,
                      confirmRemoveId === list.id && styles.removeButtonActive,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Ionicons
                      name="close"
                      size={19}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </Pressable>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </ContentCard>
      </ScreenLayout>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  itemsContainer: {
    flex: 1,
    height: 0,
    marginBottom: -5,
  },
  listContainer: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  selectedListContainer: {
    borderColor: "rgba(255, 116, 62, 1)",
  },
  itemDetails: {
    flex: 1,
  },
  listTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  listSubtitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    marginTop: 1.5,
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
  listItemsView: {
    marginTop: 8,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    marginRight: 8,
  },
  listItemText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
});
