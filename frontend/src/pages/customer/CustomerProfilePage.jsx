import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LogOut } from "lucide-react";

import { C, FONT } from "../../components/profile/profileTheme";
import ProfileHero    from "../../components/profile/ProfileHero";
import LoyaltyCard    from "../../components/profile/LoyaltyCard";
import ProfileDetails from "../../components/profile/ProfileDetails";
import QuickLinks     from "../../components/profile/QuickLinks";
import { Toast }      from "../../components/profile/ProfileUI";
import { getAuthHeaders } from "../../services/firebase";

import {
  TOAST_DURATION_MS,
  MAX_PHOTO_SIZE_MB,
  MAX_PHOTO_SIZE_BYTES,
  PROFILE_PICTURE_PATH,
  ALLOWED_IMAGE_TYPES,
  ROUTES,
} from "../../components/utils/constants";

// Base URL for all API calls — falls back to localhost in development
const API_BASE = `${(import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const auth     = getAuth();
  const storage  = getStorage();

  // Core profile state
  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [editing, setEditing]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [toast, setToast]                   = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Editable profile fields — kept separate so cancel can restore original values
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [address, setAddress]   = useState("");

  // Shows a toast notification and auto-dismisses it after the configured duration
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  // ── fetchUser — calls backend GET /api/profile/:uid ───────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;
        // Redirect to login if no authenticated user is found
        if (!currentUser) { navigate(ROUTES.LOGIN); return; }

        // Fetch profile from backend — backend reads Firestore via FirebaseService
        const res = await fetch(`${API_BASE}/profile/${currentUser.uid}`, { headers: await getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();

        // Use only the actual loyalty fields from the users collection.
        // Never use totalSpent as loyalty points.
        const mappedUser = {
          ...data,
          totalPoints: data.loyaltyPoints ?? 0,
          level: data.loyaltyTier ?? data.level ?? "Silver",
        };

        setUser(mappedUser);
        // Pre-populate edit fields with existing profile data
        setFullName(mappedUser.fullName || "");
        setPhone(mappedUser.phone       || "");
        setAddress(mappedUser.address   || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ── handleSave — calls backend PUT /api/profile/:uid ─────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Send updated fields to backend — backend writes to Firestore via FirebaseService
      const res = await fetch(`${API_BASE}/profile/${user.id}`, {
        method:  'PUT',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fullName, phone, address }),
      });
      if (!res.ok) throw new Error('Failed to update profile');

      // Update local state immediately so UI reflects changes without a refetch
      setUser(prev => ({ ...prev, fullName, phone, address }));
      setEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── handleLogout — signs out via Firebase Auth then redirects ────────────
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(ROUTES.LOGIN);
    } catch (err) {
      showToast("Logout failed.", "error");
    }
  };

  // ── handlePhotoChange ─────────────────────────────────────────────────────
  // Firebase Storage upload stays in the frontend (not a Firestore read/write).
  // Once the download URL is obtained, it is saved via backend PUT /api/profile/:uid
  // so the backend (not the frontend) writes the photoURL to Firestore.
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type before uploading
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast("Please select a valid image (JPG, PNG, WEBP, GIF).", "error");
      return;
    }
    // Validate file size before uploading
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      showToast(`Image must be smaller than ${MAX_PHOTO_SIZE_MB} MB.`, "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Step 1 — upload binary to Firebase Storage (frontend only, no Firestore involved)
      const storageRef  = ref(storage, PROFILE_PICTURE_PATH(user.id));
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Step 2 — send the resulting download URL to the backend.
      // Backend writes photoURL to Firestore via FirebaseService (no direct Firestore call here).
      const res = await fetch(`${API_BASE}/profile/${user.id}`, {
        method:  'PUT',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ photoURL: downloadURL }),
      });
      if (!res.ok) throw new Error('Failed to save photo URL');

      // Update local user state so avatar re-renders immediately without a refetch
      setUser(prev => ({ ...prev, photoURL: downloadURL }));
      showToast("Profile picture updated!");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload photo.", "error");
    } finally {
      setUploadingPhoto(false);
      // Reset file input so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  // Show loading state while profile data is being fetched from the backend
  if (loading) return (
    <div
      className="flex justify-center items-center min-h-[60vh] text-[14px]"
      style={{ color: C.textMuted, fontFamily: FONT.body, background: C.bg }}
    >
      Loading profile…
    </div>
  );

  // Return nothing if the fetch failed or returned null
  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: FONT.body }}>

      {/* Global toast notification — shown for success and error feedback */}
      <Toast toast={toast} />

      {/* Hero section with avatar and photo upload button */}
      <ProfileHero
        user={user}
        uploading={uploadingPhoto}
        onPhotoChange={handlePhotoChange}
      />

      {/* Loyalty points and customer ID card */}
      <LoyaltyCard user={user} />

      <div className="max-w-[700px] mx-auto px-6 pt-6 pb-10 flex flex-col gap-5">

        {/* Editable profile details — name, phone, address */}
        <ProfileDetails
          user={user}
          editing={editing}
          saving={saving}
          fullName={fullName}
          phone={phone}
          address={address}
          onFullNameChange={setFullName}
          onPhoneChange={setPhone}
          onAddressChange={setAddress}
          onEdit={() => setEditing(true)}
          onCancel={() => {
            // Restore original values when the user cancels editing
            setEditing(false);
            setFullName(user.fullName || "");
            setPhone(user.phone       || "");
            setAddress(user.address   || "");
          }}
          onSave={handleSave}
        />

        {/* Quick navigation links to customer store sections */}
        <QuickLinks navigate={navigate} />

        {/* Logout button — signs out from Firebase Auth and redirects */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-[13px] rounded-xl text-[14px] font-bold cursor-pointer"
          style={{
            background: C.dangerBg,
            color:      C.dangerText,
            border:     `1.5px solid ${C.dangerBorder}`,
            fontFamily: FONT.body,
          }}
        >
          <LogOut size={16} /> Log Out
        </button>

      </div>
    </div>
  );
}
