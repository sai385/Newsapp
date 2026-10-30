import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  time: string;
  image: string;
};

type NewsCardProps = {
  item: NewsItem;
};

export default function NewsCard({ item }: NewsCardProps) {
  return (
    <View style={styles.card}>

      {/* ================= IMAGE 40% ================= */}

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.imageOverlay} />

        {/* Category */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category}
          </Text>
        </View>

        {/* Time */}
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>
            {item.time}
          </Text>
        </View>
      </View>

      {/* ================= CONTENT 60% ================= */}

      <View style={styles.content}>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* TITLE */}

          <Text style={styles.title}>
            {item.title}
          </Text>

          {/* FULL DESCRIPTION */}

          <Text style={styles.description}>
            {item.description}
          </Text>

          {/* READ MORE */}

          <View style={styles.bottom}>
            <Text style={styles.readMore}>
              Read full story
            </Text>

            <Text style={styles.arrow}>
              →
            </Text>
          </View>

        </ScrollView>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
  },

  /* ================= IMAGE ================= */

  imageContainer: {
    width: "100%",
    height: "40%",
    backgroundColor: "#111827",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  categoryBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#2563EB",
  },

  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  timeBadge: {
    position: "absolute",
    bottom: 14,
    right: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  timeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  /* ================= CONTENT ================= */

  content: {
    width: "100%",
    height: "60%",
    backgroundColor: "#FFFFFF",
  },

  contentScroll: {
    flex: 1,
  },

  contentScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },

  title: {
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "800",
    color: "#111827",
  },

  description: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 27,
    color: "#6B7280",
  },

  bottom: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
  },

  readMore: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },

  arrow: {
    marginLeft: 8,
    fontSize: 21,
    color: "#2563EB",
  },
});