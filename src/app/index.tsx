import React, {
  useEffect,
  useState,
} from "react";
import { ActivityIndicator, FlatList,  StyleSheet,  Text, View,} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import Header, {
  LocationResult,
} from "../components/Header";     
import NewsCard, {
  NewsItem,
} from "../components/NewsCard";
/* =====================================================
   API
===================================================== */
const API_URL =
  "http://3.110.92.27:8000";

/* =====================================================
   PAGINATION
===================================================== */
const PAGE_LIMIT = 5;
/* =====================================================
   CATEGORY TYPE
===================================================== */
type Category = {
  id: string;
  name: string;
  slug?: string;
};

export default function HomeScreen() {
  const [newsHeight, setNewsHeight] =
    useState(0);
  const [news, setNews] =
    useState<NewsItem[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);
  const [error, setError] =
    useState("");
  const [page, setPage] =
    useState(1);
  const [hasMore, setHasMore] =
    useState(true);

  /* ===================================================
     LOCATION
  =================================================== */

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);
  /*
   * Manually selected location
   */

  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(
      null
    );
  /* ===================================================
     CATEGORIES
  =================================================== */
  const [categories, setCategories] =
    useState<Category[]>([]);
  /* ===================================================
     SELECTED CATEGORY
 
     null = All
  =================================================== */
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);
  /* ===================================================
     INITIAL LOAD
  =================================================== */
  useEffect(() => {
    loadInitialNews();
  }, []);
  /* ===================================================
     GET LOCATION + FIRST NEWS
  =================================================== */
  const loadInitialNews =
    async () => {
      try {
        setLoading(true);
        setError("");

        /* ---------------------------------------------
           1. LOCATION PERMISSION
        --------------------------------------------- */       
        const {
          status,
        } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError(
            "Location permission is required to load news."
          );
          setLoading(false);
          return;
        }
        /* ---------------------------------------------
           2. GET CURRENT LOCATION
        --------------------------------------------- */
        const location =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.Balanced,
            }
          );
        const lat =
          location.coords.latitude;
        const lon =
          location.coords.longitude;
        console.log(
          "Current Latitude:",
          lat
        );
        console.log(
          "Current Longitude:",
          lon
        );

        /* ---------------------------------------------
           3. SAVE LOCATION
        --------------------------------------------- */

        setLatitude(lat);

        setLongitude(lon);

        /*
         * We don't set selectedLocation here because
         * the GPS location doesn't have a city name yet.
         *
         * The Header will show "Select location"
         * until the user manually selects one.
         */

        /* ---------------------------------------------
           4. LOAD PAGE 1
           
           category = null means ALL
        --------------------------------------------- */

        await fetchNews(
          lat,
          lon,
          1,
          false,
          null
        );
      } catch (error: any) {
        console.log(
          "Initial news error:",
          error?.response?.data ||
          error?.message
        );
        setError(
          "Unable to load news."
        );
      } finally {
        setLoading(false);
      }
    };
  const fetchNews = async (
    lat: number,
    lon: number,
    pageNumber: number,
    isLoadMore: boolean,
    categoryId: string | null
  ) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      console.log(
        "--------------------------------"
      );

      console.log(
        "Fetching news"
      );
      console.log(
        "Latitude:",
        lat
      );
      console.log(
        "Longitude:",
        lon
      );
      console.log(
        "Page:",
        pageNumber
      );
      console.log(
        "Category:",
        categoryId
      );
      const params: any = {
        lat: lat,
        lon: lon,
        lang: "en",
        page: pageNumber,
        limit: PAGE_LIMIT,
      };
      if (categoryId) {
        params.category_id =
          categoryId;
      }

      console.log(
        "API Params:",
        params
      );

      /* -----------------------------------------------
         API REQUEST
      ----------------------------------------------- */

      const response =
        await axios.get(
          `${API_URL}/api/v1/feed`,
          {
            params,
          }
        );
      /* -----------------------------------------------
         RESPONSE DATA
      ----------------------------------------------- */


      const data =
        response.data?.data;
      const articles =
        data?.articles || [];
      const apiCategories =
        data?.categories || [];
      if (
        apiCategories.length > 0
      ) {
        setCategories(
          apiCategories
        );
      }
      console.log(
        `Page ${pageNumber} articles:`,
        articles.length
      );
      console.log(
        "Categories:",
        apiCategories
      );

      /* -----------------------------------------------
         FORMAT NEWS
      ----------------------------------------------- */

      const formattedNews:
        NewsItem[] =
        articles.map(
          (article: any) => {
            /* -----------------------------------------
               FEATURED IMAGE
            ----------------------------------------- */

            const featuredImage =
              article.media?.find(
                (media: any) =>
                  media.is_featured
              )?.file_url;
            const categoryName =
              apiCategories.find(
                (
                  category: Category
                ) =>
                  category.id ===
                  article.category_id
              )?.name ||
              "News";
            return {
              id: String(
                article.id
              ),

              category:
                categoryName,

              time:
                article.time_ago ||
                "",

              title:
                article.title ||
                "",

              /*
               * Content first
               * Summary second
               */

              description:
                article.content ||
                article.summary ||
                "",

              image:
                featuredImage ||
                "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200",
            };
          }
        );
      if (pageNumber === 1) {
        setNews(
          formattedNews
        );
      } else {

        setNews(
          (
            previousNews
          ) => [
              ...previousNews,
              ...formattedNews,
            ]
        );
      }

      /* -----------------------------------------------
         UPDATE PAGE
      ----------------------------------------------- */

      setPage(
        pageNumber
      );

      /* -----------------------------------------------
         CHECK MORE DATA
      ----------------------------------------------- */

      if (
        articles.length <
        PAGE_LIMIT
      ) {
        console.log(
          "No more pages available."
        );

        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error: any) {
      console.log(
        `Page ${pageNumber} error:`,
        error?.response?.data ||
        error?.message
      );
      if (pageNumber === 1) {
        setError(
          "Unable to load news."
        );
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  const handleLocationSelect =
    async (
      location: LocationResult
    ) => {
      try {
        console.log(
          "================================"
        );

        console.log(
          "Manual location selected"
        );

        console.log(
          "City:",
          location.city
        );

        console.log(
          "Latitude:",
          location.lat
        );

        console.log(
          "Longitude:",
          location.lon
        );

        console.log(
          "================================"
        );

        /* ---------------------------------------------
           SAVE SELECTED LOCATION
        --------------------------------------------- */

        setSelectedLocation(
          location
        );

        /* ---------------------------------------------
           SAVE COORDINATES
        --------------------------------------------- */

        setLatitude(
          location.lat
        );

        setLongitude(
          location.lon
        );

        /* ---------------------------------------------
           RESET PAGINATION
        --------------------------------------------- */

        setPage(1);

        setHasMore(true);
        setNews([]);

        setError("");

        /* ---------------------------------------------
           FETCH NEWS FOR SELECTED LOCATION
           
           Keep current category.
           
           Example:
           
           Hyderabad + Sports
           
           or
           
           Mumbai + All
        --------------------------------------------- */

        await fetchNews(
          location.lat,
          location.lon,
          1,
          false,
          selectedCategory
        );
      } catch (error) {
        console.log(
          "Manual location error:",
          error
        );

        setError(
          "Unable to load news for this location."
        );
      }
    };
  const handleCategorySelect =
    async (
      categoryId: string | null
    ) => {
      if (
        latitude === null ||
        longitude === null
      ) {
        console.log(
          "Location not available"
        );

        return;
      }

      console.log(
        "Selected category:",
        categoryId
      );

      /* -----------------------------------------------
         Save selected category
         
         null = ALL
      ----------------------------------------------- */

      setSelectedCategory(
        categoryId
      );

      /* -----------------------------------------------
         Reset pagination
      ----------------------------------------------- */

      setPage(1);

      setHasMore(true);

      /* -----------------------------------------------
         Clear existing news
         
         This prevents old category articles from
         remaining visible while new category loads.
      ----------------------------------------------- */

      setNews([]);

      setError("");

      /* -----------------------------------------------
         Fetch first page for selected category
      ----------------------------------------------- */

      await fetchNews(
        latitude,
        longitude,
        1,
        false,
        categoryId
      );
    };

  /* ===================================================
     LOAD NEXT PAGE
  =================================================== */

  const loadNextPage = () => {
    /* -----------------------------------------------
       Prevent duplicate API calls
    ----------------------------------------------- */

    if (loadingMore) {
      return;
    }

    /* -----------------------------------------------
       No more pages
    ----------------------------------------------- */

    if (!hasMore) {
      return;
    }

    /* -----------------------------------------------
       Location unavailable
    ----------------------------------------------- */

    if (
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    /* -----------------------------------------------
       Don't load another page while initial loading
    ----------------------------------------------- */

    if (loading) {
      return;
    }

    /* -----------------------------------------------
       Next page
    ----------------------------------------------- */

    const nextPage =
      page + 1;

    console.log(
      "Requesting next page:",
      nextPage
    );

    /* -----------------------------------------------
       IMPORTANT:
       
       Send selectedCategory here.
       
       Therefore:
       
       Sports page 2
       -> category_id=sports-id
       
       All page 2
       -> no category_id
    ----------------------------------------------- */

    fetchNews(
      latitude,
      longitude,
      nextPage,
      true,
      selectedCategory
    );
  };
  return (
    <View
      style={styles.container}
    >
      <Header
        categories={
          categories
        }
        selectedCategory={
          selectedCategory
        }
        onCategorySelect={
          handleCategorySelect
        }
        /*
         * Manual location
         */

        selectedLocation={
          selectedLocation
        }

        onLocationSelect={
          handleLocationSelect
        }
      />
      <View
        style={styles.newsContainer}
        onLayout={(event) => {
          const height =
            event.nativeEvent.layout
              .height;
          if (
            height !==
            newsHeight
          ) {
            setNewsHeight(
              height
            );
          }
        }}
      >
        {/* ===============================================
            INITIAL LOADING
        =============================================== */}

        {loading && (
          <View
            style={styles.center}
          >
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading news...
            </Text>
          </View>
        )}

        {/* ===============================================
            ERROR
        =============================================== */}

        {!loading &&
          error !== "" && (
            <View
              style={styles.center}
            >
              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </View>
          )}

        {/* ===============================================
            NO NEWS
        =============================================== */}

        {!loading &&
          error === "" &&
          news.length === 0 &&
          newsHeight > 0 && (
            <View
              style={styles.center}
            >
              <Text
                style={
                  styles.errorText
                }
              >
                No news available.
              </Text>
            </View>
          )}

        {/* ===============================================
            NEWS LIST
        =============================================== */}

        {!loading &&
          error === "" &&
          newsHeight > 0 &&
          news.length > 0 && (
            <FlatList
              data={news}

              /* -----------------------------------------
                 KEY
              ----------------------------------------- */

              keyExtractor={(
                item
              ) =>
                String(item.id)
              }

              /* -----------------------------------------
                 CARD
              ----------------------------------------- */

              renderItem={({
                item,
              }) => (
                <View
                  style={{
                    width: "100%",
                    height:
                      newsHeight,
                  }}
                >
                  <NewsCard
                    item={item}
                  />
                </View>
              )}

              /* =========================================
                 ONE CARD PER SCREEN
              ========================================= */

              pagingEnabled

              snapToAlignment="start"

              decelerationRate="fast"

              bounces={false}

              showsVerticalScrollIndicator={
                false
              }

              showsHorizontalScrollIndicator={
                false
              }

              removeClippedSubviews={
                true
              }

              /* -----------------------------------------
                 ITEM LAYOUT
              ----------------------------------------- */

              getItemLayout={(
                _data,
                index
              ) => ({
                length:
                  newsHeight,

                offset:
                  newsHeight *
                  index,

                index,
              })}

              /* =========================================
                 PAGINATION
              ========================================= */

              onEndReached={
                loadNextPage
              }

              onEndReachedThreshold={
                0.2
              }

              /* =========================================
                 FOOTER
              ========================================= */

              ListFooterComponent={
                loadingMore ? (
                  <View
                    style={
                      styles.footer
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#2563EB"
                    />

                    <Text
                      style={
                        styles.footerText
                      }
                    >
                      Loading more news...
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
      </View>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    /* ===============================================
       MAIN
    =============================================== */

    container: {
      flex: 1,

      width: "100%",

      backgroundColor:
        "#FFFFFF",
    },

    /* ===============================================
       NEWS CONTAINER
    =============================================== */

    newsContainer: {
      flex: 1,

      width: "100%",

      backgroundColor:
        "#FFFFFF",

      overflow: "hidden",
    },

    /* ===============================================
       CENTER
    =============================================== */

    center: {
      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      paddingHorizontal: 20,
    },

    /* ===============================================
       LOADING
    =============================================== */

    loadingText: {
      marginTop: 12,

      fontSize: 15,

      color: "#6B7280",
    },

    /* ===============================================
       ERROR
    =============================================== */

    errorText: {
      fontSize: 16,

      color: "#6B7280",

      textAlign: "center",
    },

    /* ===============================================
       FOOTER
    =============================================== */

    footer: {
      height: 70,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    footerText: {
      marginTop: 6,

      fontSize: 13,

      color: "#6B7280",
    },
  });