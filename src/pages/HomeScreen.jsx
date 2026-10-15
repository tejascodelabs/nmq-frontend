import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import {
    QrCode,
    Search,
    X,
    MapPin,
    Star,
    Ticket,
    ChevronLeft,
    ChevronRight,
    Compass,
    Image as ImageIcon,
    Utensils,
    AlertTriangle,
    UtensilsCrossed,
    Sparkles
} from 'lucide-react'
import AdvertisementCarousel from '../components/AdvertisementCarousel'
import MisalLoader from '../components/MisalLoader'

export default function HomeScreen() {
    const navigate = useNavigate()

    const [shops, setShops] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [gallery, setGallery] = useState(null)
    const [lightboxIndex, setLightboxIndex] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')

    const quickFilters = [
        { id: 'all', label: 'All Shops', icon: UtensilsCrossed },
        { id: 'open', label: 'Open Now', icon: Sparkles },
        { id: 'top', label: 'Top Rated (4.5+)', icon: Star }
    ]

    // ==========================================
    // 1. FETCH ALL SHOPS (GET)
    // ==========================================
// ==========================================
    // 1. FETCH ALL SHOPS (GET)
    // ==========================================
    const fetchShops = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.get('/shops')
            const shopData = response.data?.data ?? response.data
            const shopList = Array.isArray(shopData) ? shopData : [shopData]

            setShops(
                shopList
                    .filter(Boolean)
                    .filter((shop) => shop.status !== 'inactive') // Inactive shops ko screen se hata diya
                    .map((shop) => ({
                        ...shop,
                        name: shop.shopName,
                        rating: Number(shop.initialRating) || 0,
                        total_reviews: shop.totalReviews || 0,
                        direction_url: shop.directionUrl,
                        shop_images: shop.images || [],
                        // Only active menus
                        menu_items: Array.isArray(shop.menus)
                            ? shop.menus.filter(
                                (menu) => menu.status === 'active'
                            )
                            : [],

                        // shopStatus ko 'open' ya 'closed' set kiya
                        shopStatus: shop.shopStatus === 'open' ? 'open' : 'closed',
                    }))
            )
        } catch (err) {
            console.error('Error fetching shops:', err);
            setError('Failed to load shops from backend.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchShops();
    }, []);

    const filteredShops = shops.filter((shop) => {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
            shop.name?.toLowerCase().includes(search) ||
            shop.address?.toLowerCase().includes(search)

        if (!matchesSearch) return false
        if (activeFilter === 'open') return shop.status === 'open'
        if (activeFilter === 'top') return (shop.rating || 0) >= 4.5
        return true
    })

    // ---- Lightbox photo list + navigation helpers ----
    const activeMenuItems =
        gallery?.type === 'menu'
            ? (gallery.menu_items || []).filter(
                (item) => item.status === 'active'
            )
            : []

    const galleryPhotos =
        gallery?.type === 'menu'
            ? activeMenuItems
                .filter((item) => item.image)
                .map((item) => item.image)
            : gallery?.shop_images || []

    const currentMenuItem =
        gallery?.type === 'menu' && lightboxIndex !== null
            ? activeMenuItems[lightboxIndex]
            : null

    const openLightbox = (index) => setLightboxIndex(index)
    const closeLightbox = () => setLightboxIndex(null)

    const showPrevPhoto = () => {
        setLightboxIndex((i) =>
            i === null ? null : (i - 1 + galleryPhotos.length) % galleryPhotos.length
        )
    }

    const showNextPhoto = () => {
        setLightboxIndex((i) =>
            i === null ? null : (i + 1) % galleryPhotos.length
        )
    }

    // Keyboard navigation for the lightbox (Esc / Arrow keys)
    useEffect(() => {
        if (lightboxIndex === null) return

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox()
            if (e.key === 'ArrowLeft') showPrevPhoto()
            if (e.key === 'ArrowRight') showNextPhoto()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [lightboxIndex, galleryPhotos.length])

    // Basic touch-swipe support for mobile
    const touchStartX = useRef(0)
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(deltaX) < 40) return
        if (deltaX > 0) showPrevPhoto()
        else showNextPhoto()
    }
    if (loading) {
        return <MisalLoader />
    }
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                <div className="w-full max-w-sm bg-white rounded-2xl p-7 text-center border border-gray-200 shadow-md">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Unable to Load Shops
                    </h2>
                    <p className="text-gray-500 text-sm mb-5">{error}</p>
                    <button
                        onClick={fetchShops}
                        className="w-full h-11 bg-[#fc8019] text-white font-bold rounded-xl hover:bg-orange-600 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-white pb-28 font-sans antialiased">
            {/* Main Container */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* STICKY APP BAR HEADER */}
                <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/60 pb-3 pt-4 transition-all">

                    {/* Header Banner Section */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">
                                👋 Welcome
                            </span>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                Nashik's Misal Hub
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                                Explore top-rated misal shops, compare queues and join instantly.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/scan-qr')}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-[#fc8019] bg-white text-[#fc8019] flex items-center justify-center shrink-0 shadow-sm hover:bg-orange-50 active:scale-95 transition"
                            aria-label="Scan QR Code"
                        >
                            <QrCode className="w-6 h-6 sm:w-7 sm:h-7" />
                        </button>
                    </div>

                    {/* Search Input Area */}
                    <div className="mb-3">
                        <div className="relative flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:border-[#fc8019] focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3.5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search shops or locations..."
                                className="w-full pl-11 pr-10 py-2.5 bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 outline-none"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Filter Horizontal Tray */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
                        {quickFilters.map((filter) => {
                            const isSelected = activeFilter === filter.id
                            const IconComponent = filter.icon
                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${isSelected
                                        ? 'bg-[#fc8019] text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    {filter.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Advertisement */}
                <div className="mt-4 px-4">
                    <AdvertisementCarousel
                        shopId={null}
                        placement="shop_list"
                    />
                </div>

                {/* Dynamic Results Counter */}
                <div className="py-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        🍽 {filteredShops.length} Misal Shop{filteredShops.length !== 1 ? 's' : ''} Found
                    </span>
                </div>

                {/* Restaurant List Grid (Responsive sm:1 col, md:2 cols, lg:3 cols) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {filteredShops.length === 0 ? (
                        <div className="col-span-full text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="text-base font-semibold text-gray-800 mb-1">
                                No matches found
                            </p>
                            <p className="text-xs text-gray-500">
                                Try adjusting your search filters
                            </p>
                        </div>
                    ) : (
                        filteredShops.map((shop) => (
                            <ShopCard
                                key={shop.id}
                                shop={shop}
                                onImages={() => setGallery({ ...shop, type: 'images' })}
                                onMenu={() => setGallery({ ...shop, type: 'menu' })}
                            />
                        ))
                    )}
                </div>

                {/* Floating Bottom Nav Sheet */}
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 shadow-lg">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={() => navigate('/check-token')}
                            className="w-full h-12 bg-[#fc8019] hover:bg-orange-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-98 transition-all"
                        >
                            <Ticket className="w-5 h-5" />
                            Check My Token Status
                        </button>
                    </div>
                </div>

                {/* Gallery Modal Sheet */}
                {gallery && (
                    <div
                        onClick={() => setGallery(null)}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    {gallery.name}{' '}
                                    <span className="text-[#fc8019] font-medium">
                                        • {gallery.type === 'menu' ? 'Menu' : 'Gallery'}
                                    </span>
                                </h3>
                                <button
                                    onClick={() => setGallery(null)}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {(
                                gallery.type === 'menu'
                                    ? (gallery.menu_items || []).filter(
                                        (item) => item.status === 'active'
                                    )
                                    : gallery.shop_images || []
                            )?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {(
                                        gallery.type === 'menu'
                                            ? (gallery.menu_items || []).filter(
                                                (item) => item.status === 'active'
                                            )
                                            : gallery.shop_images || []
                                    ).map((item, index) => (
                                        <div
                                            key={item.id || index}
                                            onClick={() => openLightbox(index)}
                                            className="border border-gray-200 rounded-xl overflow-hidden bg-white cursor-pointer group transition transform hover:scale-[1.02]"
                                        >
                                            <img
                                                src={
                                                    gallery.type === 'menu'
                                                        ? item.image
                                                        : item
                                                }
                                                alt={item.name || ''}
                                                className="w-full h-28 sm:h-36 object-cover"
                                            />

                                            {gallery.type === 'menu' && (
                                                <div className="p-2">
                                                    <div className="font-semibold text-xs text-gray-800 truncate">
                                                        {item.name}
                                                    </div>

                                                    {/* {item.description && (
                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {item.description}
                                                        </div>
                                                    )} */}

                                                    <div className="text-xs font-bold text-[#fc8019] mt-0.5">
                                                        ₹{item.price}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 text-xs sm:text-sm">
                                    No items uploaded yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Full-Screen Lightbox */}
                {lightboxIndex !== null && galleryPhotos.length > 0 && (
                    <div
                        onClick={closeLightbox}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between"
                    >
                        {/* Top Bar */}
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between p-4 shrink-0"
                        >
                            <div className="flex flex-col gap-1">
                                <span className="text-white/80 text-xs font-bold bg-white/10 px-3 py-1 rounded-full w-fit">
                                    {lightboxIndex + 1} / {galleryPhotos.length}
                                </span>
                                {currentMenuItem && (
                                    <span className="text-white text-sm font-bold">
                                        {currentMenuItem.name}{' '}
                                        <span className="text-[#fc8019]">· ₹{currentMenuItem.price}</span>
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={closeLightbox}
                                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Stage */}
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 flex items-center justify-center relative px-2 min-h-0"
                        >
                            {galleryPhotos.length > 1 && (
                                <button
                                    onClick={showPrevPhoto}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition z-10"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}

                            <img
                                key={lightboxIndex}
                                src={galleryPhotos[lightboxIndex]}
                                alt=""
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />

                            {galleryPhotos.length > 1 && (
                                <button
                                    onClick={showNextPhoto}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition z-10"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {/* Bottom Thumbnails */}
                        {galleryPhotos.length > 1 && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex gap-2 p-4 overflow-x-auto no-scrollbar shrink-0"
                            >
                                {galleryPhotos.map((photo, i) => (
                                    <img
                                        key={i}
                                        src={photo}
                                        alt=""
                                        onClick={() => setLightboxIndex(i)}
                                        className={`w-14 h-14 object-cover rounded-lg cursor-pointer shrink-0 transition-all ${i === lightboxIndex
                                            ? 'opacity-100 ring-2 ring-[#fc8019]'
                                            : 'opacity-40 hover:opacity-75'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

function ShopCard({ shop, onImages, onMenu }) {
    const isOpen = shop.shopStatus === 'open'

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
                <div className="flex gap-3 sm:gap-4">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative bg-gray-100 shrink-0 shadow-inner">
                        {shop.profileImage ? (
                            <img
                                src={shop.profileImage}
                                alt={shop.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                                🏪
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                        {/* Status Badge */}
                        <div
                            className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white backdrop-blur-md shadow-sm ${isOpen ? 'bg-emerald-500/90' : 'bg-red-500/90'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {isOpen ? 'OPEN' : 'CLOSED'}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight truncate">
                            {shop.name}
                        </h2>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 my-1.5">
                            <div
                                className={`inline-flex items-center gap-1 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-xs ${(shop.rating || 4.0) >= 4.0 ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                            >
                                <Star className="w-3 h-3 fill-white" />
                                <span>{shop.rating || '4.0'}</span>
                            </div>

                            <span className="text-gray-500 text-xs font-medium">
                                ({shop.total_reviews || 0} reviews)
                            </span>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-1 text-gray-500 text-xs leading-snug">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
                            <span className="line-clamp-2">{shop.address}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-dashed border-gray-200 my-3" />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={onImages}
                    className="h-9 rounded-lg border border-gray-200 bg-white text-gray-800 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-gray-50 active:scale-95 transition"
                >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Photos
                </button>

                <button
                    onClick={onMenu}
                    className="h-9 rounded-lg border border-gray-200 bg-white text-gray-800 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-gray-50 active:scale-95 transition"
                >
                    <Utensils className="w-3.5 h-3.5" />
                    Menu
                </button>

                <button
                    onClick={() => window.open(shop.direction_url, "_blank", "noopener,noreferrer")}
                    className="h-9 rounded-lg bg-orange-50 text-[#fc8019] font-bold text-xs flex items-center justify-center gap-1 hover:bg-orange-100 active:scale-95 transition"
                >
                    <Compass className="w-3.5 h-3.5" />
                    Map
                </button>
            </div>
        </div>
    )
}