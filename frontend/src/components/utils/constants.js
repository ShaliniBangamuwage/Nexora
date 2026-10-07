// src/components/utils/constants.js

export const TOAST_DURATION_MS    = 3000;
export const MAX_PHOTO_SIZE_MB    = 5;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const PROFILE_PICTURE_PATH = (userId) => `profile_pictures/${userId}`;
export const ALLOWED_IMAGE_TYPES  = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Routes
export const ROUTES = {
  LOGIN:                "/login",
  CUSTOMER_RETURNS:      "/customer/returns",
};

// Firestore collections
export const COLLECTIONS = {
  USERS:            "users",
  CUSTOMER_ORDERS:  "CustomerOrders",
  CUSTOMER_RETURNS: "CustomerReturns",
};

// Hero Carousel
export const HERO_BADGE_LABEL     = "NEXORA TECH";
export const HERO_CAROUSEL_HEIGHT = "520px";
export const HERO_IMAGE_HEIGHT    = "460px";