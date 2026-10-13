import { useEffect, useState } from 'react';
import {
  HomeIcon,
  Settings2Icon,
  RadioIcon,
  BarChart3Icon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";
import useAuthStore from "../../store/auth.store";
import { RefreshCw, LoaderCircle } from "lucide-react";
import api from "../../api/axios";

const EMPTY_LIVE_QUEUE = {
  Q2: { waiting: 0 },
  Q4: { waiting: 0 },
  Q6: { waiting: 0 },
  Q8: { waiting: 0 }
};

const EMPTY_TODAY_SUMMARY = {
  waiting: 0,
  arrived: 0,
  notArrived: 0,
  cancelled: 0
};

const getPayload = (response) => response.data?.data ?? response.data;

const getCount = (data, keys) => {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return Number(value) || 0;
  }
  return 0;
};

const normalizeLiveQueue = (data) => {
  const queueData = data?.liveQueue ?? data?.live_queue ?? data?.queues ??
    [];

  if (Array.isArray(queueData)) {
    const normalized = {
      Q2: { waiting: 0 },
      Q4: { waiting: 0 },
      Q6: { waiting: 0 },
      Q8: { waiting: 0 }
    };

    queueData.forEach((queue) => {
      const queueType = queue?.queue_type;

      if (!queueType) return;

      if (normalized[queueType]) {
        normalized[queueType] = {
          waiting: Number(queue?.count) || 0
        };
      }
    });

    return normalized;
  }

  // Fallback if API returns an object instead of an array
  return Object.fromEntries(
    Object.keys(EMPTY_LIVE_QUEUE).map((queue) => {
      const queueInfo = queueData?.[queue] ?? {};

      const waiting =
        typeof queueInfo === 'number'
          ? queueInfo
          : getCount(queueInfo, [
            'waiting',
            'waitingCount',
            'waiting_count',
            'count'
          ]);

      return [
        queue,
        {
          waiting
        }
      ];
    })
  );
};


const normalizeTodaySummary = (data) => {
  const summary = data?.todaySummary ?? data?.today_summary ?? data?.summary ?? data;

  return {
    waiting: getCount(summary, ['waiting', 'waitingCount', 'waiting_count']),
    arrived: getCount(summary, ['arrived', 'arrivedCount', 'arrived_count']),
    notArrived: getCount(summary, ['notArrived', 'not_arrived', 'notArrivedCount', 'not_arrived_count']),
    cancelled: getCount(summary, ['cancelled', 'canceled', 'cancelledCount', 'cancelled_count'])
  };
};

// const fetchOwnerDashboardData = async (userId) => {
//   const shopResponse = await api.get(`/shops/profile/${userId}`);
//   const shopPayload = getPayload(shopResponse);
//   const shop = shopPayload?.shop ?? shopPayload;
//   const shopId = shop?.id ?? shop?._id;

//   if (!shopId) {
//     throw new Error('Shop ID was not returned for this owner.');
//   }

//   const dashboardResponse = await api.get(`/dashboard/owner/${shopId}`);
//   const dashboardPayload = getPayload(dashboardResponse);
//   const dashboard = dashboardPayload?.dashboard ?? dashboardPayload;

//   return {
//     shop,
//     shopName: shop?.shopName ?? shop?.name ?? '',
//     liveQueue: normalizeLiveQueue(dashboard),
//     todaySummary: normalizeTodaySummary(dashboard)
//   };
// };


const fetchOwnerDashboardData = async (userId) => {
  const shopResponse = await api.get(`/shops/profile/${userId}`);

  const shopPayload = getPayload(shopResponse);
  const shop = shopPayload?.shop ?? shopPayload;

  const shopId = shop?.id ?? shop?._id;

  if (!shopId) {
    throw new Error('Shop ID was not returned for this owner.');
  }

  const dashboardResponse = await api.get(`/dashboard/owner/${shopId}`);

  const dashboardPayload = getPayload(dashboardResponse);
  const dashboard = dashboardPayload?.dashboard ?? dashboardPayload;

  return {
    shop,
    shopId,

    shopName: shop?.shopName ?? shop?.name ?? '',

    // Actual DB status fields
    shopStatus: shop?.shopStatus ?? shop?.shop_status ?? 'inactive',

    shopOpenStatus:
      shop?.shopOpenStatus ??
      shop?.shop_open_status ??
      'close',

    queueStatus:
      shop?.queueStatus ??
      shop?.queue_status ??
      'pause',

    liveQueue: normalizeLiveQueue(dashboard),
    todaySummary: normalizeTodaySummary(dashboard)
  };
};


const INITIAL_STAFF_STATUS = [
  {
    id: 's1',
    staff_id: 'STF-101',
    full_name: 'Sarah Connor',
    role: 'counter',
    is_logged_in: true,
    login_time: '2026-09-19T08:30:00Z'
  },
  {
    id: 's2',
    staff_id: 'STF-102',
    full_name: 'John Doe',
    role: 'staff',
    is_logged_in: true,
    selected_section: 'Q4',
    selected_section_login_time: '2026-09-19T09:15:00Z'
  },
  {
    id: 's3',
    staff_id: 'STF-103',
    full_name: 'Emma Watson',
    role: 'staff',
    is_logged_in: true,
    selected_section: 'Q8',
    selected_section_login_time: '2026-09-19T10:00:00Z'
  }
];

export default function OwnerDashboard() {

  const { user } = useAuthStore();

  const [shopStatus, setShopStatus] = useState('inactive');
  const [shopOpenStatus, setShopOpenStatus] = useState('close');
  const [queueStatus, setQueueStatus] = useState('pause');

  const [shopActionLoading, setShopActionLoading] = useState(false);
  const [queueActionLoading, setQueueActionLoading] = useState(false);

  const [shopName, setShopName] = useState('');
  const [liveQueue, setLiveQueue] = useState(EMPTY_LIVE_QUEUE);
  const [todaySummary, setTodaySummary] = useState(EMPTY_TODAY_SUMMARY);
  const [staffStatus, setStaffStatus] = useState(INITIAL_STAFF_STATUS);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(Boolean(user?.id));
  const [dashboardError, setDashboardError] = useState('');
  const isOpen = shopOpenStatus === 'open';
  const isActive = queueStatus === 'start';

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    let cancelled = false;

 fetchOwnerDashboardData(user.id)
  .then(
    ({
      shopName: name,
      liveQueue: queueData,
      todaySummary: summaryData,
      shopStatus: currentShopStatus,
      shopOpenStatus: currentShopOpenStatus,
      queueStatus: currentQueueStatus
    }) => {
      if (cancelled) return;

      setShopName(name);

      setShopStatus(currentShopStatus);
      setShopOpenStatus(currentShopOpenStatus);
      setQueueStatus(currentQueueStatus);

      setLiveQueue(queueData);
      setTodaySummary(summaryData);
    }
  )
  .catch((error) => {
    if (!cancelled) {
      setDashboardError(
        error.response?.data?.message ||
        error.message ||
        'Unable to load dashboard data.'
      );
    }
  })
  .finally(() => {
    if (!cancelled) setDashboardLoading(false);
  });


    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Section filter
  const [activeSections, setActiveSections] = useState(['all']);

  // Dynamic status check
  const isSectionActive = (key) => activeSections.includes('all') || activeSections.includes(key);

  // Toggle filter sections
  const handleSectionClick = (key) => {
    if (key === 'all') {
      setActiveSections(['all']);
      return;
    }
    setActiveSections((prev) => {
      const current = prev.filter((item) => item !== 'all');
      if (current.includes(key)) {
        const updated = current.filter((item) => item !== key);
        return updated.length === 0 ? ['all'] : updated;
      }
      return [...current, key];
    });
  };

  // Actions
  const refreshDashboard = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    setDashboardError('');
    try {
      const {
        shopName: name,
        liveQueue: queueData,
        todaySummary: summaryData,
        shopStatus: currentShopStatus,
        shopOpenStatus: currentShopOpenStatus,
        queueStatus: currentQueueStatus
      } = await fetchOwnerDashboardData(user.id);
      setShopName(name);
      setShopStatus(currentShopStatus);
      setShopOpenStatus(currentShopOpenStatus);
      setQueueStatus(currentQueueStatus);
      setLiveQueue(queueData);
      setTodaySummary(summaryData);
    } catch (error) {
      setDashboardError(error.response?.data?.message || error.message || 'Unable to load dashboard data.');
    } finally {
      setRefreshing(false);
    }
  };
const toggleShop = async () => {
  if (!user?.id || shopActionLoading) return;

  try {
    setShopActionLoading(true);
    setDashboardError('');

    // Get shop ID
    const shopResponse = await api.get(`/shops/profile/${user.id}`);
    const shopPayload = getPayload(shopResponse);
    const shop = shopPayload?.shop ?? shopPayload;

    const shopId = shop?.id ?? shop?._id;

    if (!shopId) {
      throw new Error('Shop ID was not found.');
    }

    const nextStatus =
      shopOpenStatus === 'open' ? 'close' : 'open';

    const response = await api.patch(
      `/shops/${shopId}/shop-status`,
      {
        shopOpenStatus: nextStatus
      }
    );

    const updatedShop =
      response.data?.data ?? response.data;

    // Update shop open status
    setShopOpenStatus(
      updatedShop?.shopOpenStatus ??
      updatedShop?.shop_open_status ??
      nextStatus
    );

    // IMPORTANT:
    // Backend automatically pauses queue when shop is closed.
    if (nextStatus === 'close') {
      setQueueStatus('pause');
    }

  } catch (error) {
    console.error('Toggle Shop Error:', error);

    setDashboardError(
      error.response?.data?.message ||
      error.message ||
      'Failed to change shop status.'
    );
  } finally {
    setShopActionLoading(false);
  }
};


const toggleQueue = async () => {
  if (!user?.id || queueActionLoading) return;

  // Queue start is only allowed when shop is active + open
  if (
    queueStatus !== 'start' &&
    (shopStatus !== 'active' || shopOpenStatus !== 'open')
  ) {
    setDashboardError(
      'Queue can only be started when the shop is active and open.'
    );

    return;
  }

  try {
    setQueueActionLoading(true);
    setDashboardError('');

    // Get shop ID
    const shopResponse = await api.get(`/shops/profile/${user.id}`);
    const shopPayload = getPayload(shopResponse);
    const shop = shopPayload?.shop ?? shopPayload;

    const shopId = shop?.id ?? shop?._id;

    if (!shopId) {
      throw new Error('Shop ID was not found.');
    }

    const nextStatus =
      queueStatus === 'start' ? 'pause' : 'start';

    const response = await api.patch(
      `/shops/${shopId}/queue-status`,
      {
        queueStatus: nextStatus
      }
    );

    const updatedShop =
      response.data?.data ?? response.data;

    setQueueStatus(
      updatedShop?.queueStatus ??
      updatedShop?.queue_status ??
      nextStatus
    );

  } catch (error) {
    console.error('Toggle Queue Error:', error);

    setDashboardError(
      error.response?.data?.message ||
      error.message ||
      'Failed to change queue status.'
    );
  } finally {
    setQueueActionLoading(false);
  }
};

  const handleForceLogout = (staffId) => {
    if (window.confirm('Are you sure you want to force logout this staff member?')) {
      setStaffStatus((prev) =>
        prev.map((staff) => (staff.id === staffId ? { ...staff, is_logged_in: false } : staff))
      );
    }
  };

  const handleBroadcast = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setMessage('');
      alert('Message sent successfully!');
    }, 500);
  };

  const onlineStaff = staffStatus.filter((staff) => staff.is_logged_in);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6 text-slate-800 antialiased">
      {/* PAGE HEADER */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-xl font-bold text-slate-700">
            {shopName}
          </div>
          <div className="text-sm font-medium text-slate-500">
            {greeting}, {user.name}
          </div>
          {dashboardError && (
            <div role="alert" className="mt-1 text-xs font-medium text-red-600">
              {dashboardError}
            </div>
          )}
          {dashboardLoading && (
            <div className="mt-1 text-xs text-slate-400">Loading shop dashboard...</div>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs sm:text-sm">
            <span className={`font-semibold ${isOpen ? 'text-emerald-600' : 'text-red-600'}`}>
              {isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
            </span>
          </div>
        </div>


        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          {refreshing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </>
          )}
        </button>

      </div>

      {/* SECTION FILTER BAR */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {[
          {
            key: "all",
            label: "All",
            icon: HomeIcon,
          },
          {
            key: "controls",
            label: "Quick Controls",
            icon: Settings2Icon,
          },
          {
            key: "live",
            label: "Live Queue",
            icon: RadioIcon,
          },
          {
            key: "summary",
            label: "Today's Summary",
            icon: BarChart3Icon,
          },
          // {
          //   key: "message",
          //   label: "Send Msg to Customers",
          //   icon: MessageSquareIcon,
          // },
          // {
          //   key: "staff",
          //   label: "Staff Status",
          //   icon: UsersIcon,
          // },
        ].map(({ key, label, icon: Icon }) => {
          const active = activeSections.includes(key);

          return (
            <button
              key={key}
              onClick={() => handleSectionClick(key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all sm:text-sm ${active
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* QUICK CONTROLS */}
      {isSectionActive('controls') && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Quick Controls</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-300">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <span className="text-sm font-semibold text-slate-600">Shop Status</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">{isOpen ? 'OPEN' : 'CLOSED'}</h3>
              <p className="mb-4 text-xs text-slate-500">
                {isOpen ? 'Customers can visit your shop.' : 'Shop is closed.'}
              </p>
              <button
                onClick={toggleShop}
                className={`w-full rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition shadow-sm ${isOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'
                  }`}
              >
                {isOpen ? 'Close Shop' : 'Open Shop'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-300">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="text-sm font-semibold text-slate-600">Queue Status</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">{isActive ? 'ACTIVE' : 'PAUSED'}</h3>
              <p className="mb-4 text-xs text-slate-500">
                {isActive ? 'Customers can join queue.' : 'Queue is paused.'}
              </p>
              <button
                onClick={toggleQueue}
                className={`w-full rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition shadow-sm ${isActive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
              >
                {isActive ? 'Pause Queue' : 'Resume Queue'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LIVE QUEUE */}
      {isSectionActive('live') && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Live Queue</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'Q2', color: 'border-t-emerald-500' },
              { key: 'Q4', color: 'border-t-blue-500' },
              { key: 'Q6', color: 'border-t-amber-500' },
              { key: 'Q8', color: 'border-t-purple-500' }
            ].map(({ key, color }) => (
              <div
                key={key}
                className={`relative rounded-xl border border-slate-200 border-t-4 bg-slate-50/50 p-4 text-center ${color}`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{key}</div>
                <div className="my-1 text-2xl font-black text-slate-900 sm:text-3xl">
                  {liveQueue[key].waiting}
                </div>
                <div className="text-xs text-slate-400">Waiting: {liveQueue[key].waiting}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TODAY'S SUMMARY */}
      {isSectionActive('summary') && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Today's Summary</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="relative rounded-xl border border-slate-200 border-t-4 border-t-blue-500 bg-slate-50/50 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting</div>
              <div className="my-1 text-2xl font-black text-slate-900 sm:text-3xl">{todaySummary.waiting}</div>
              <div className="text-xs text-slate-400">Currently Waiting</div>
            </div>

            <div className="relative rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 bg-slate-50/50 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Arrived</div>
              <div className="my-1 text-2xl font-black text-slate-900 sm:text-3xl">{todaySummary.arrived}</div>
              <div className="text-xs text-slate-400">Customer Arrived</div>
            </div>

            <div className="relative rounded-xl border border-slate-200 border-t-4 border-t-amber-500 bg-slate-50/50 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Not Arrived</div>
              <div className="my-1 text-2xl font-black text-slate-900 sm:text-3xl">{todaySummary.notArrived}</div>
              <div className="text-xs text-slate-400">Not Arrived</div>
            </div>

            <div className="relative rounded-xl border border-slate-200 border-t-4 border-t-red-500 bg-slate-50/50 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Cancelled</div>
              <div className="my-1 text-2xl font-black text-slate-900 sm:text-3xl">{todaySummary.cancelled}</div>
              <div className="text-xs text-slate-400">Cancelled Tokens</div>
            </div>
          </div>
        </section>
      )}

      {/* BROADCAST MESSAGE */}
      {/* {isSectionActive('message') && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">📢 Send Message to Customers</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  icon: '⏳',
                  title: 'Queue Delayed',
                  desc: 'Inform customers about a delay',
                  text: 'Queue is running a little late. Thank you for your patience.'
                },
                {
                  icon: '🕐',
                  title: 'Please Wait',
                  desc: 'Let customers know to wait',
                  text: 'Your table will be ready shortly. Please wait.'
                },
                {
                  icon: '🍽️',
                  title: 'Kitchen Busy',
                  desc: 'Inform customers about service delay',
                  text: 'Kitchen is busy. Service may take a few extra minutes.'
                },
                {
                  icon: '✓',
                  title: 'Thank You',
                  desc: 'Send a friendly customer message',
                  text: 'Thank you for visiting us. Enjoy your meal!'
                }
              ].map(({ icon, title, desc, text }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setMessage(text)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-amber-400 hover:bg-amber-50/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-lg text-orange-600">
                    {icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900">{title}</span>
                    <span className="block text-[11px] text-slate-500">{desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your custom announcement..."
              rows={3}
              maxLength={150}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm"
            />

            <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <span className="text-xs text-slate-400">{message.length}/150</span>
              <button
                onClick={handleBroadcast}
                disabled={sending || !message.trim()}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
              >
                {sending ? '⏳ Sending...' : '📤 Send Message'}
              </button>
            </div>
          </div>
        </section>
      )} */}

      {/* STAFF STATUS */}
      {/* {isSectionActive('staff') && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">👥 Staff Status</h2>

          {onlineStaff.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No staff currently online</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {onlineStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="relative rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{staff.full_name}</div>
                      <div className="text-xs text-slate-500 capitalize">
                        {staff.role === 'counter' ? 'Counter Staff' : 'Serving Staff'}
                      </div>
                      <div className="text-[11px] text-slate-400">Staff ID: {staff.staff_id}</div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </span>
                  </div>

                  <div className="mb-3 flex gap-2">
                    <div className="flex-1 rounded-lg bg-slate-50 p-2 text-center">
                      <span className="block text-[10px] text-slate-400">Logged in</span>
                      <strong className="block text-xs text-slate-800">
                        {staff.login_time
                          ? new Date(staff.login_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : '--'}
                      </strong>
                    </div>

                    {staff.role === 'staff' && (
                      <div className="flex-1 rounded-lg bg-slate-50 p-2 text-center">
                        <span className="block text-[10px] text-slate-400">Section</span>
                        <span className="block text-xs font-bold uppercase text-slate-800">
                          {staff.selected_section || '--'}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleForceLogout(staff.id)}
                    className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                  >
                    ⛔ Force Logout
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )} */}
    </div>
  );
}