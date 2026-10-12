import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Store,
  User,
  Phone,
  MapPin,
  Clock,
  Star,
  MessageSquare,
  Edit3,
  Check,
  X,
  Camera,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import useAuthStore from "../../store/auth.store";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/shops`;

const INITIAL_SHOP_DATA = {
  id: null,
  name: "",
  ownerName: "",
  mobile: "",
  altMobile: "",
  address: "",
  directionUrl: "",
  openTime: "",
  closeTime: "",
  rating: 0,
  totalReviews: 0,
  plan: "free",
  status: "inactive",
  profileImage: "",
  galleryImages: [],
};

export default function ProfilePage() {
  const { user } = useAuthStore();

  const [shop, setShop] = useState(INITIAL_SHOP_DATA);
  const [formData, setFormData] = useState(INITIAL_SHOP_DATA);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [toast, setToast] = useState("");

  // New image files
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);

  const logoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // ==========================================
  // TOAST
  // ==========================================
  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };


  // ==========================================
  // GET SHOP BY USER ID
  // GET /shops/user/:userId
  // ==========================================
  const fetchShopById = async (userId) => {
    if (!userId) {
      console.log("User ID not available");
      return;
    }

    try {
      setFetching(true);

      console.log("Fetching shop for user ID:", userId);

      const response = await axios.get(`${API_BASE_URL}/${userId}`);

      console.log("GET SHOP BY USER ID:", response);

      const shopData = response?.data?.data || response?.data;

      if (!shopData) {
        console.log("Shop data not found");
        return;
      }

      // ==========================================
      // BACKEND DATA → FRONTEND DATA
      // ==========================================
      const formattedShop = {
        id: shopData?.id || shopData?._id || null,
        name: shopData?.shopName || "",
        ownerName: shopData?.ownerName || "",
        mobile: shopData?.phoneNo || "",
        altMobile: shopData?.altPhoneNo || "",
        address: shopData?.address || "",
        directionUrl: shopData?.directionUrl || "",

        openTime: shopData?.openingTime
          ? shopData.openingTime.slice(0, 5)
          : "",

        closeTime: shopData?.closingTime
          ? shopData.closingTime.slice(0, 5)
          : "",

        rating: Number(shopData?.initialRating || 0),

        totalReviews: Number(
          shopData?.totalReviews || 0
        ),

        plan: shopData?.plan || "free",

        status: shopData?.status || "inactive",

        profileImage:
          shopData?.profileImage ||
          shopData?.profile_image ||
          "",

        galleryImages: Array.isArray(shopData?.images)
          ? shopData.images
          : [],
      };

      console.log("FORMATTED SHOP:", formattedShop);

      // ==========================================
      // SAVE SHOP ID IN LOCAL STORAGE
      // ==========================================
      if (formattedShop.id) {
        localStorage.setItem(
          "shopId",
          String(formattedShop.id)
        );

        console.log(
          "Shop ID saved in localStorage:",
          formattedShop.id
        );
      }

      // Set display data
      setShop(formattedShop);

      // Set edit form data
      setFormData(formattedShop);

      // Clear selected new files
      setProfileImageFile(null);
      setGalleryImageFiles([]);

    } catch (error) {
      console.error(
        "Error fetching shop:",
        error
      );

      alert(
        error?.response?.data?.message ||
        "Failed to fetch shop details."
      );
    } finally {
      setFetching(false);
    }
  };

  // ==========================================
  // FETCH SHOP WHEN USER IS AVAILABLE
  // ==========================================
  useEffect(() => {
    if (user?.id) {
      fetchShopById(user.id);
    }
  }, [user?.id]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // PROFILE IMAGE UPLOAD
  // ==========================================
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setProfileImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      profileImage: previewUrl,
    }));

    showToast("Profile image selected!");
  };

  // ==========================================
  // GALLERY IMAGE UPLOAD
  // ==========================================
  const handleGalleryUpload = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) return;

    setGalleryImageFiles((prev) => [
      ...prev,
      ...files,
    ]);

    const previewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setFormData((prev) => ({
      ...prev,
      galleryImages: [
        ...prev.galleryImages,
        ...previewUrls,
      ],
    }));

    e.target.value = "";

    showToast("Gallery image added!");
  };

  // ==========================================
  // REMOVE GALLERY IMAGE
  // ==========================================
  const removeGalleryImage = (index) => {
    const imageToRemove =
      formData.galleryImages[index];

    // Remove preview
    const updatedGallery =
      formData.galleryImages.filter(
        (_, i) => i !== index
      );

    setFormData((prev) => ({
      ...prev,
      galleryImages: updatedGallery,
    }));

    // If it is a newly selected local image,
    // remove corresponding file.
    if (
      typeof imageToRemove === "string" &&
      imageToRemove.startsWith("blob:")
    ) {
      const blobImages =
        formData.galleryImages.filter(
          (image) =>
            typeof image === "string" &&
            image.startsWith("blob:")
        );

      const blobIndex =
        blobImages.indexOf(imageToRemove);

      if (blobIndex !== -1) {
        setGalleryImageFiles((prev) =>
          prev.filter(
            (_, i) => i !== blobIndex
          )
        );
      }
    }

    showToast("Image removed");
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================
  const handleCancel = () => {
    setFormData(shop);

    setProfileImageFile(null);
    setGalleryImageFiles([]);

    setIsEditing(false);
  };

  // ==========================================
  // UPDATE SHOP
  // PUT /shops/:shopId
  // ==========================================
  const handleUpdate = async (e) => {
    e?.preventDefault();

    if (!shop.id) {
      alert("Shop ID not found.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();

      // ==========================================
      // BASIC SHOP DETAILS
      // ==========================================
      payload.append(
        "shopName",
        formData.name || ""
      );

      payload.append(
        "ownerName",
        formData.ownerName || ""
      );

      payload.append(
        "phoneNo",
        formData.mobile || ""
      );

      payload.append(
        "altPhoneNo",
        formData.altMobile || ""
      );

      payload.append(
        "address",
        formData.address || ""
      );

      payload.append(
        "openingTime",
        formData.openTime || ""
      );

      payload.append(
        "closingTime",
        formData.closeTime || ""
      );

      payload.append(
        "initialRating",
        formData.rating ?? ""
      );

      payload.append(
        "totalReviews",
        formData.totalReviews ?? ""
      );

      payload.append(
        "directionUrl",
        formData.directionUrl || ""
      );

      payload.append(
        "plan",
        formData.plan || "free"
      );

      payload.append(
        "status",
        formData.status || "inactive"
      );

      // ==========================================
      // PROFILE IMAGE
      // ==========================================
      if (profileImageFile) {
        payload.append(
          "profile_image",
          profileImageFile
        );
      }

      // ==========================================
      // NEW GALLERY IMAGES
      // ==========================================
      galleryImageFiles.forEach((file) => {
        payload.append("images", file);
      });

      console.log(
        "Updating shop using shop ID:",
        shop.id
      );

      const response = await axios.put(
        `${API_BASE_URL}/${shop.id}`,
        payload,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "UPDATE SHOP RESPONSE:",
        response.data
      );

      // ==========================================
      // GET UPDATED SHOP DATA
      // ==========================================
      await fetchShopById(user.id);

      setIsEditing(false);

      showToast(
        "Shop profile updated successfully!"
      );

    } catch (error) {
      console.error(
        "Update shop error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to update shop."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-3 text-sm text-slate-500">
            Loading shop profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ==========================================
            TOAST
        ========================================== */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl text-sm font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        )}

        {/* ==========================================
            HEADER
        ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80">

          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-indigo-600" />
              Shop Profile
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage your restaurant details and
              public profile.
            </p>
          </div>

          <div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setFormData(shop);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save All Changes
                    </>
                  )}
                </button>

              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            ANALYTICS
        ========================================== */}
        <div className="grid grid-cols-2 gap-4">

          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">

            <div className="rounded-xl bg-amber-50 p-3 text-amber-500">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rating
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {shop.rating} / 5.0
              </p>
            </div>

          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">

            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <MessageSquare className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Reviews
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {shop.totalReviews}
              </p>
            </div>

          </div>

        </div>

        {/* ==========================================
            PROFILE FORM
        ========================================== */}
        <form
          onSubmit={handleUpdate}
          className="space-y-6"
        >

          {/* ==========================================
              PROFILE INFORMATION
          ========================================== */}
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-6">

            {/* Logo Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">

              <div className="relative group">

                {shop.profileImage ? (
                  <img
                    src={shop.profileImage}
                    alt="Shop Logo"
                    className="h-28 w-28 rounded-2xl object-cover ring-4 ring-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-2xl bg-slate-100 flex items-center justify-center ring-4 ring-slate-100">
                    <Store className="w-10 h-10 text-slate-400" />
                  </div>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      logoInputRef.current?.click()
                    }
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                )}

                <input
                  type="file"
                  ref={logoInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />

              </div>

              <div className="text-center sm:text-left space-y-1">

                <h2 className="text-xl font-bold text-slate-900">
                  {shop.name}
                </h2>

                <p className="text-sm text-slate-500">
                  Owned by {shop.ownerName}
                </p>

                {isEditing && (
                  <p className="text-xs text-indigo-600 font-medium">
                    Click logo to upload new avatar
                  </p>
                )}

              </div>

            </div>

            {/* ==========================================
                FIELD GRID
            ========================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* SHOP NAME */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Shop Name
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {shop.name}
                  </p>
                )}
              </div>

              {/* OWNER NAME */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Owner Name
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {shop.ownerName}
                  </p>
                )}
              </div>

              {/* MOBILE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Mobile Number
                </label>

                {isEditing ? (
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {shop.mobile}
                  </p>
                )}
              </div>

              {/* ALT MOBILE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Alternate Mobile
                </label>

                {isEditing ? (
                  <input
                    type="tel"
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {shop.altMobile || "Not provided"}
                  </p>
                )}
              </div>

              {/* BUSINESS HOURS */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Business Hours
                </label>

                {isEditing ? (
                  <div className="flex items-center gap-2">

                    <input
                      type="time"
                      name="openTime"
                      value={formData.openTime}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm"
                    />

                    <span className="text-slate-400 text-xs">
                      to
                    </span>

                    <input
                      type="time"
                      name="closeTime"
                      value={formData.closeTime}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm"
                    />

                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />

                    {shop.openTime || "--:--"}{" "}
                    -{" "}
                    {shop.closeTime || "--:--"}
                  </p>
                )}
              </div>

              {/* STATUS */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Status
                </label>

                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 capitalize">
                    {shop.status}
                  </p>
                )}
              </div>

              {/* ADDRESS */}
              <div className="sm:col-span-2">

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Address
                </label>

                {isEditing ? (
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />

                    {shop.address}
                  </p>
                )}

              </div>

              {/* DIRECTION URL */}
              <div className="sm:col-span-2">

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Google Maps URL
                </label>

                {isEditing ? (
                  <input
                    type="url"
                    name="directionUrl"
                    value={formData.directionUrl}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">

                    <span className="text-sm font-medium text-slate-800 truncate">
                      {shop.directionUrl ||
                        "Not provided"}
                    </span>

                    {shop.directionUrl && (
                      <a
                        href={shop.directionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline shrink-0 ml-2"
                      >
                        Open Map
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                  </div>
                )}

              </div>

            </div>
          </div>

          {/* ==========================================
              SHOP GALLERY
          ========================================== */}
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-4">

            <div className="flex items-center justify-between">

              <h3 className="text-base font-bold text-slate-900">
                Shop Gallery
              </h3>

              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      galleryInputRef.current?.click()
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Photo
                  </button>

                  <input
                    type="file"
                    ref={galleryInputRef}
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                  />
                </>
              )}

            </div>

            {/* GALLERY */}
            {formData.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                {formData.galleryImages.map(
                  (img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                    >

                      <img
                        src={img}
                        alt={`Gallery ${idx + 1
                          }`}
                        className="h-full w-full object-cover"
                      />

                      {isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            removeGalleryImage(
                              idx
                            )
                          }
                          className="absolute top-2 right-2 rounded-full bg-rose-600 p-1.5 text-white opacity-0 group-hover:opacity-100 transition hover:scale-110"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Camera className="w-8 h-8 mx-auto text-slate-300" />

                <p className="mt-2 text-sm text-slate-400">
                  No gallery images
                </p>
              </div>
            )}

          </div>

        </form>

      </div>
    </div>
  );
}