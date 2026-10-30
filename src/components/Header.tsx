import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

/* =====================================================
   TYPES
===================================================== */

export type Category = {
  id: string;
  name: string;
};

export type LocationResult = {
  id: string;
  displayName: string;
  city: string;
  lat: number;
  lon: number;
};

type HeaderProps = {
  categories?: Category[];

  selectedCategory?: string | null;

  onCategorySelect?: (
    categoryId: string | null
  ) => void;

  /* Location callback */
  onLocationSelect?: (
    location: LocationResult
  ) => void;

  selectedLocation?: LocationResult | null;
};

/* =====================================================
   NOMINATIM SEARCH
===================================================== */

async function searchLocation(
  query: string
): Promise<LocationResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json` +
    `&addressdetails=1` +
    `&limit=6` +
    `&q=${encodeURIComponent(query.trim())}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NewslyMobileApp/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const data = await response.json();

  return data.map((item: any) => ({
    id: String(item.place_id),

    displayName:
      item.display_name || "",

    city:
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.municipality ||
      item.address?.county ||
      item.name ||
      "",

    lat: Number(item.lat),

    lon: Number(item.lon),
  }));
}

/* =====================================================
   HEADER
===================================================== */

export default function Header({
  categories = [],
  selectedCategory = null,
  onCategorySelect,

  onLocationSelect,

  selectedLocation = null,
}: HeaderProps) {
  /* ===================================================
     MENU
  =================================================== */

  const [menuOpen, setMenuOpen] =
    useState(false);

  /* ===================================================
     CATEGORY
  =================================================== */

  const [categoryOpen, setCategoryOpen] =
    useState(false);

  /* ===================================================
     LOCATION MODAL
  =================================================== */

  const [locationOpen, setLocationOpen] =
    useState(false);

  const [locationQuery, setLocationQuery] =
    useState("");

  const [locationResults, setLocationResults] =
    useState<LocationResult[]>([]);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const debounceRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* ===================================================
     SELECTED CATEGORY NAME
  =================================================== */

  const selectedCategoryName =
    selectedCategory === null
      ? "All"
      : categories.find(
          (category) =>
            category.id === selectedCategory
        )?.name || "All";

  /* ===================================================
     SELECTED LOCATION NAME
  =================================================== */

  const selectedLocationName =
    selectedLocation?.city ||
    "Select location";

  /* ===================================================
     LOCATION SEARCH
  =================================================== */

  useEffect(() => {
    /*
      Clear previous debounce
    */

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    /*
      Empty search
    */

    if (!locationQuery.trim()) {
      setLocationResults([]);
      setLocationLoading(false);
      setLocationError("");

      return;
    }

    /*
      Minimum 2 characters
    */

    if (locationQuery.trim().length < 2) {
      setLocationResults([]);
      return;
    }

    /*
      Start loading
    */

    setLocationLoading(true);
    setLocationError("");

    /*
      Debounce
    */

    debounceRef.current = setTimeout(
      async () => {
        try {
          const results =
            await searchLocation(
              locationQuery
            );

          setLocationResults(results);
        } catch (error) {
          console.log(
            "Location search error:",
            error
          );

          setLocationResults([]);

          setLocationError(
            "Couldn't search locations. Try again."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      500
    );

    /*
      Cleanup
    */

    return () => {
      if (debounceRef.current) {
        clearTimeout(
          debounceRef.current
        );
      }
    };
  }, [locationQuery]);

  /* ===================================================
     OPEN LOCATION
  =================================================== */

  const openLocationModal = () => {
    setMenuOpen(false);

    setCategoryOpen(false);

    setLocationQuery("");

    setLocationResults([]);

    setLocationError("");

    setLocationOpen(true);
  };

  /* ===================================================
     CLOSE LOCATION
  =================================================== */

  const closeLocationModal = () => {
    setLocationOpen(false);

    setLocationQuery("");

    setLocationResults([]);

    setLocationError("");
  };

  /* ===================================================
     LOCATION SELECT
  =================================================== */

  const handleLocationSelect = (
    location: LocationResult
  ) => {
    console.log(
      "Selected location:",
      location
    );

    /*
      Send location to HomeScreen
    */

    onLocationSelect?.(location);

    /*
      Close location modal
    */

    closeLocationModal();
  };

  /* ===================================================
     CATEGORY SELECT
  =================================================== */

  const handleCategorySelect = (
    categoryId: string | null
  ) => {
    onCategorySelect?.(categoryId);

    setCategoryOpen(false);

    setMenuOpen(false);
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              NEWSLY
            </Text>

            {/* Selected location under logo */}

            <TouchableOpacity
              style={styles.headerLocation}
              onPress={openLocationModal}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-outline"
                size={13}
                color="#6B7280"
              />

              <Text
                style={styles.headerLocationText}
                numberOfLines={1}
              >
                {selectedLocationName}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={12}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              setMenuOpen(true)
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="menu-outline"
              size={30}
              color="#111827"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* =================================================
          MENU DRAWER
      ================================================= */}

      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setMenuOpen(false)
        }
      >
        <View style={styles.modalContainer}>
          {/* Overlay */}

          <Pressable
            style={styles.overlay}
            onPress={() =>
              setMenuOpen(false)
            }
          />

          {/* Drawer */}

          <View style={styles.drawer}>
            {/* Drawer Header */}

            <View
              style={styles.drawerHeader}
            >
              <Text
                style={styles.drawerTitle}
              >
                NEWSLY
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setMenuOpen(false)
                }
              >
                <Ionicons
                  name="close-outline"
                  size={28}
                  color="#111827"
                />
              </TouchableOpacity>
            </View>

            {/* =================================================
                LOCATION MENU
            ================================================= */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={
                openLocationModal
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-outline"
                size={21}
                color="#4B5563"
              />

              <View
                style={styles.menuItemContent}
              >
                <Text
                  style={styles.menuTitle}
                >
                  Location
                </Text>

                <Text
                  style={styles.menuSubtitle}
                  numberOfLines={1}
                >
                  {selectedLocationName}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {/* =================================================
                CATEGORIES
            ================================================= */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                setCategoryOpen(
                  (previous) =>
                    !previous
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color="#4B5563"
              />

              <View
                style={styles.menuItemContent}
              >
                <Text
                  style={styles.menuTitle}
                >
                  Categories
                </Text>

                <Text
                  style={styles.menuSubtitle}
                >
                  {selectedCategoryName}
                </Text>
              </View>

              <Ionicons
                name={
                  categoryOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {/* =================================================
                CATEGORY LIST
            ================================================= */}

            {categoryOpen && (
              <ScrollView
                style={
                  styles.categoryList
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {/* ALL */}

                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory ===
                      null &&
                      styles.selectedCategory,
                  ]}
                  onPress={() =>
                    handleCategorySelect(
                      null
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory ===
                        null &&
                        styles.selectedCategoryText,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                {/* API CATEGORIES */}

                {categories.map(
                  (category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory ===
                          category.id &&
                          styles.selectedCategory,
                      ]}
                      onPress={() =>
                        handleCategorySelect(
                          category.id
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory ===
                            category.id &&
                            styles.selectedCategoryText,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* =================================================
          LOCATION SEARCH MODAL
      ================================================= */}

      <Modal
        visible={locationOpen}
        transparent
        animationType="fade"
        onRequestClose={
          closeLocationModal
        }
      >
        <View
          style={styles.locationModalContainer}
        >
          {/* Background */}

          <Pressable
            style={styles.locationOverlay}
            onPress={
              closeLocationModal
            }
          />

          {/* Search Modal */}

          <View
            style={styles.locationModal}
          >
            {/* Search Header */}

            <View
              style={
                styles.locationSearchHeader
              }
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#9CA3AF"
              />

              <TextInput
                autoFocus
                value={locationQuery}
                onChangeText={
                  setLocationQuery
                }
                placeholder="Search city or place..."
                placeholderTextColor="#9CA3AF"
                style={
                  styles.locationInput
                }
                returnKeyType="search"
              />

              <TouchableOpacity
                onPress={
                  closeLocationModal
                }
                style={
                  styles.closeButton
                }
              >
                <Ionicons
                  name="close-outline"
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* =================================================
                RESULTS
            ================================================= */}

            <ScrollView
              style={
                styles.locationResults
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* Loading */}

              {locationLoading && (
                <View
                  style={
                    styles.locationMessage
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#2563EB"
                  />

                  <Text
                    style={
                      styles.messageText
                    }
                  >
                    Searching...
                  </Text>
                </View>
              )}

              {/* Error */}

              {!locationLoading &&
                locationError !== "" && (
                  <View
                    style={
                      styles.locationMessage
                    }
                  >
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {locationError}
                    </Text>
                  </View>
                )}

              {/* No results */}

              {!locationLoading &&
                !locationError &&
                locationQuery.trim()
                  .length >= 2 &&
                locationResults.length ===
                  0 && (
                  <View
                    style={
                      styles.locationMessage
                    }
                  >
                    <Text
                      style={
                        styles.messageText
                      }
                    >
                      No matching locations
                    </Text>
                  </View>
                )}

              {/* Search hint */}

              {!locationLoading &&
                !locationError &&
                !locationQuery.trim() && (
                  <View
                    style={
                      styles.locationMessage
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={24}
                      color="#9CA3AF"
                    />

                    <Text
                      style={
                        styles.messageText
                      }
                    >
                      Search for a city or
                      place
                    </Text>
                  </View>
                )}

              {/* Results */}

              {!locationLoading &&
                locationResults.map(
                  (place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={
                        styles.locationResult
                      }
                      onPress={() =>
                        handleLocationSelect(
                          place
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={
                          styles.locationIcon
                        }
                      >
                        <Ionicons
                          name="location-outline"
                          size={19}
                          color="#6B7280"
                        />
                      </View>

                      <View
                        style={
                          styles.locationResultContent
                        }
                      >
                        <Text
                          style={
                            styles.locationCity
                          }
                          numberOfLines={1}
                        >
                          {place.city ||
                            place.displayName.split(
                              ","
                            )[0]}
                        </Text>

                        <Text
                          style={
                            styles.locationAddress
                          }
                          numberOfLines={2}
                        >
                          {
                            place.displayName
                          }
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward-outline"
                        size={17}
                        color="#D1D5DB"
                      />
                    </TouchableOpacity>
                  )
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  /* ===================================================
     HEADER
  =================================================== */

  safeArea: {
    backgroundColor: "#FFFFFF",
  },

  header: {
    minHeight: 64,

    paddingHorizontal: 18,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,

    borderBottomColor: "#E5E7EB",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.08,

    shadowRadius: 2,

    elevation: 2,
  },

  logo: {
    fontSize: 22,

    fontWeight: "800",

    color: "#111827",

    letterSpacing: 1,
  },

  headerLocation: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 2,

    maxWidth: 220,
  },

  headerLocationText: {
    marginLeft: 4,

    marginRight: 3,

    fontSize: 11,

    color: "#6B7280",

    fontWeight: "500",
  },

  menuButton: {
    width: 42,

    height: 42,

    alignItems: "center",

    justifyContent: "center",
  },

  /* ===================================================
     MENU MODAL
  =================================================== */

  modalContainer: {
    flex: 1,

    flexDirection: "row",
  },

  overlay: {
    flex: 1,

    backgroundColor:
      "rgba(0,0,0,0.40)",
  },

  /* ===================================================
     DRAWER
  =================================================== */

  drawer: {
    position: "absolute",

    left: 0,

    top: 0,

    bottom: 0,

    width: "80%",

    maxWidth: 320,

    backgroundColor: "#FFFFFF",

    paddingTop: 55,

    shadowColor: "#000",

    shadowOffset: {
      width: 2,

      height: 0,
    },

    shadowOpacity: 0.15,

    shadowRadius: 8,

    elevation: 10,
  },

  drawerHeader: {
    height: 60,

    paddingHorizontal: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    borderBottomWidth: 1,

    borderBottomColor: "#F3F4F6",
  },

  drawerTitle: {
    fontSize: 20,

    fontWeight: "800",

    color: "#111827",
  },

  /* ===================================================
     MENU
  =================================================== */

  menuItem: {
    minHeight: 64,

    paddingHorizontal: 20,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth: 1,

    borderBottomColor: "#F3F4F6",
  },

  menuItemContent: {
    flex: 1,

    marginLeft: 14,
  },

  menuTitle: {
    fontSize: 15,

    fontWeight: "700",

    color: "#111827",
  },

  menuSubtitle: {
    marginTop: 3,

    fontSize: 12,

    color: "#9CA3AF",

    textTransform: "capitalize",
  },

  /* ===================================================
     CATEGORIES
  =================================================== */

  categoryList: {
    maxHeight: 350,

    marginLeft: 42,
  },

  categoryItem: {
    paddingHorizontal: 16,

    paddingVertical: 13,

    borderLeftWidth: 2,

    borderLeftColor: "#F3F4F6",
  },

  selectedCategory: {
    backgroundColor: "#EEF2FF",

    borderLeftColor: "#2563EB",
  },

  categoryText: {
    fontSize: 14,

    color: "#374151",

    textTransform: "capitalize",
  },

  selectedCategoryText: {
    color: "#2563EB",

    fontWeight: "700",
  },

  /* ===================================================
     LOCATION MODAL
  =================================================== */

  locationModalContainer: {
    flex: 1,

    justifyContent: "flex-start",

    alignItems: "center",

    paddingTop: 90,

    paddingHorizontal: 16,
  },

  locationOverlay: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    backgroundColor:
      "rgba(0,0,0,0.45)",
  },

  locationModal: {
    width: "100%",

    maxWidth: 450,

    maxHeight: "70%",

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    overflow: "hidden",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,

      height: 5,
    },

    shadowOpacity: 0.2,

    shadowRadius: 10,

    elevation: 10,
  },

  locationSearchHeader: {
    minHeight: 58,

    paddingHorizontal: 16,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth: 1,

    borderBottomColor: "#E5E7EB",
  },

  locationInput: {
    flex: 1,

    marginLeft: 10,

    marginRight: 8,

    fontSize: 15,

    color: "#111827",

    paddingVertical: 8,
  },

  closeButton: {
    width: 36,

    height: 36,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 18,
  },

  locationResults: {
    maxHeight: 450,
  },

  /* ===================================================
     LOCATION RESULT
  =================================================== */

  locationResult: {
    flexDirection: "row",

    alignItems: "flex-start",

    paddingHorizontal: 16,

    paddingVertical: 14,

    borderBottomWidth: 1,

    borderBottomColor: "#F3F4F6",
  },

  locationIcon: {
    width: 34,

    height: 34,

    borderRadius: 17,

    backgroundColor: "#F3F4F6",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 12,
  },

  locationResultContent: {
    flex: 1,

    paddingRight: 8,
  },

  locationCity: {
    fontSize: 15,

    fontWeight: "700",

    color: "#111827",

    marginBottom: 3,
  },

  locationAddress: {
    fontSize: 12,

    lineHeight: 17,

    color: "#6B7280",
  },

  /* ===================================================
     LOCATION MESSAGE
  =================================================== */

  locationMessage: {
    minHeight: 120,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 20,

    gap: 8,
  },

  messageText: {
    fontSize: 14,

    color: "#9CA3AF",

    textAlign: "center",
  },

  errorText: {
    fontSize: 14,

    color: "#EF4444",

    textAlign: "center",
  },
});