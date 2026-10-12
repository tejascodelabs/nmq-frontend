import { useEffect, useState, useRef } from 'react';
import {
  UtensilsCrossed,
  Plus,
  List,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  createMenuApi,
  deleteMenuApi,
  getMenusApi,
  updateMenuApi,
  updateMenuStatusApi,
} from '../../api/menu.api';
import useAuthStore from '../../store/auth.store';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Starter',
  price: '',
  isDiscount: false,
  discountPrice: '',
  status: 'active',
  image: '',
  imageFile: null,
};

const normalizeMenuItem = (item) => ({
  ...item,
  price: String(item.price ?? ''),
  discountPrice: String(item.discountPrice ?? ''),
  status: item.status || 'active',
  image: item.image ?? item.imageUrl ?? item.image_url ?? '',
});

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form'
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const shopId = localStorage.getItem("shopId");

  console.log("SHOP ID", shopId);


  // Form State
  const [form, setForm] = useState(EMPTY_FORM);

  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true);
        setError('');
        const menus = await getMenusApi(shopId);
        setMenuItems(menus.map(normalizeMenuItem));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Unable to load menu items.');
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, [shopId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setActiveTab('form');
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "",
      price: item.price || "",
      isDiscount: Boolean(item.isDiscount),
      discountPrice: item.discountPrice || "",
      status: item.status || "active",
      image: item.image || "",
      imageFile: null,
    });
    setActiveTab('form');
  };

  // const handleImageChange = (e) => {
  //   const file = e.target.files?.[0];

  //   if (!file) return;

  //   const previewUrl = URL.createObjectURL(file);

  //   setForm((prev) => ({
  //     ...prev,
  //     image: previewUrl,      // preview ke liye
  //     imageFile: file,        // actual file upload ke liye
  //   }));
  // };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: URL.createObjectURL(file),
      imageFile: file,
    }));
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      return alert('Please fill in required fields');
    }

    try {
      setSaving(true);
      setError('');

      const formData = new FormData();

      formData.append("shopId", shopId);
      formData.append("name", form.name.trim());
      formData.append("description", form.description || "");
      formData.append("category", form.category || "");
      formData.append("price", String(form.price));
      formData.append("isDiscount", String(form.isDiscount));
      formData.append("discountPrice", form.discountPrice || "");
      formData.append("status", form.status || "active");

      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      console.log("Image file:", form.imageFile);
      console.log("Image is File:", form.imageFile instanceof File);
      console.log("FormData image:", formData.get("image"));

      //  if (form.imageFile instanceof File) {
      //     formData.append("image", form.imageFile);
      //   }

      console.log("Selected image:", form.imageFile);
      console.log("FormData entries:");

      for (const [key, value] of formData.entries()) {
        console.log(
          key,
          value instanceof File
            ? {
              name: value.name,
              type: value.type,
              size: value.size,
            }
            : value
        );
      }

      const savedItem = editingId
        ? await updateMenuApi(editingId, formData)
        : await createMenuApi(formData);

      const existingImage = menuItems.find((item) => item.id === editingId)?.image;
      const normalizedItem = normalizeMenuItem({
        ...savedItem,
        image: savedItem?.image ?? savedItem?.imageUrl ?? savedItem?.image_url ?? existingImage,
      });

      setMenuItems((prev) => editingId
        ? prev.map((item) => (item.id === editingId ? normalizedItem : item))
        : [normalizedItem, ...prev]);
      showToast(editingId ? 'Menu item updated!' : 'New menu item added!');
      resetForm();
      setActiveTab('list');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const updatedItem = await updateMenuStatusApi(item.id, nextStatus);
      setMenuItems((prev) => prev.map((menuItem) => (
        menuItem.id === item.id ? normalizeMenuItem(updatedItem) : menuItem
      )));
      showToast(`Item status changed to ${nextStatus}`);
    } catch (statusError) {
      setError(statusError.response?.data?.message || 'Unable to update item status.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteMenuApi(id);
        setMenuItems((prev) => prev.filter((item) => item.id !== id));
        showToast('Menu item deleted');
      } catch (deleteError) {
        setError(deleteError.response?.data?.message || 'Unable to delete menu item.');
      }
    }
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl text-sm font-medium animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-indigo-600" /> Menu Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Configure offerings, pricing, and availability status.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${activeTab === 'list'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <List className="w-4 h-4" /> All Items
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Plus className="w-4 h-4" /> {editingId ? 'Edit Item' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* TAB 1: LIST VIEW TABLE */}
        {activeTab === 'list' && (
          <div className="rounded-2xl bg-white shadow-xs border border-slate-200/80 overflow-hidden">
            {error && (
              <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Total Items: {filteredItems.length}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-4">Item Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">Loading menu items...</td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No menu items found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isActive = item.status === 'active';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">

                          {/* Item Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-11 w-11 rounded-xl object-cover border border-slate-100"
                              />
                              <span className="font-bold text-slate-900">{item.name}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 font-medium text-slate-500">
                            {item.category}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{item.price}
                          </td>

                          {/* Status Switch */}
                          <td className="py-3 px-4">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isActive}
                                onClick={() => handleToggleStatus(item)}
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${isActive ? 'translate-x-5.5' : 'translate-x-0.5'
                                    }`}
                                />
                              </button>
                              <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {isActive ? 'Active' : 'Disabled'}
                              </span>
                            </label>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ADD / EDIT MENU ITEM FORM */}
        {activeTab === 'form' && (
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80 max-w-2xl mx-auto space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>

            <form onSubmit={handleSaveItem} className="space-y-4">

              {/* Image Preview & File Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Item Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Choose File
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cheese Burst Pizza"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe this menu item"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="199"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isDiscount}
                    onChange={(e) => setForm({ ...form, isDiscount: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Apply discount
                </label>
                {form.isDiscount && (
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Discounted price"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                )}
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Initial Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={form.status === 'active'}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="disabled"
                      checked={form.status === 'disabled'}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Disabled
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('list');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Item' : 'Save Item'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}