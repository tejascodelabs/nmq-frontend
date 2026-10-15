import { useState, useEffect, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import useAuthStore from "../../store/auth.store";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const authenticatedFetch = (url, options = {}) => {
  const accessToken = localStorage.getItem("accessToken");
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });
};

const normalizeToken = (token, defaultQueueType) => ({
  id: token.id,
  status: token.status,
  queue_type: token.queueType ?? token.queue_type ?? defaultQueueType,
  token_no: token.tokenNo ?? token.token_no,
  customer_name: token.name ?? token.customer_name ?? `Customer ${token.tokenNo || token.token_no || ''}`,
  phone: token.mobile ?? token.phone ?? "",
  group_size: token.groupSize ?? token.group_size ?? 1,
  calledByStaffName: token.calledByStaffName ?? null,
  calledAt: token.calledAt ?? null,
  expiresAt: token.expiresAt ?? null,
});

const playBellChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn("Audio Bell Chime Playback failed:", err);
  }
};

function CallTimer({ expiresAt, calledAt }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const target = expiresAt ? new Date(expiresAt).getTime() : (calledAt ? new Date(calledAt).getTime() + 120_000 : Date.now() + 120_000);
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = expiresAt ? new Date(expiresAt).getTime() : (calledAt ? new Date(calledAt).getTime() + 120_000 : Date.now() + 120_000);
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, calledAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <span className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs ${timeLeft <= 15 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-100 text-amber-800'}`}>
      ⏱ Call Timer: {mins}:{secs < 10 ? `0${secs}` : secs}
    </span>
  );
}

export default function StaffDashboard() {
  const { user, logout } = useAuthStore();

  const [staff, setStaff] = useState(null);
  const [shop, setShop] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [waitingTokens, setWaitingTokens] = useState([]);
  const [pendingArrivals, setPendingArrivals] = useState([]);

  const [selectedQueues, setSelectedQueues] = useState(["ALL"]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [popup, setPopup] = useState({ open: false, title: "", message: "" });
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const profileRes = await authenticatedFetch(`${API_BASE_URL}/staff/${user.id}/profile`);
      const profileResult = await profileRes.json();

      if (!profileRes.ok || !profileResult.success) {
        throw new Error(profileResult.message || "Failed to fetch staff profile");
      }

      const staffData = profileResult.data.user;
      const shopData = profileResult.data.shop;

      setStaff(staffData);
      setShop(shopData);

      if (shopData?.id) {
        const tokenRes = await authenticatedFetch(`${API_BASE_URL}/tokens/shop/${shopData.id}`);
        const tokenResult = await tokenRes.json();

        if (!tokenRes.ok || !tokenResult.success) {
          throw new Error(tokenResult.message || "Failed to fetch shop tokens");
        }

        const responseTokens = tokenResult.tokens ?? tokenResult.data?.tokens ?? tokenResult.data ?? [];
        
        let allParsedTokens = [];
        if (Array.isArray(responseTokens)) {
          allParsedTokens = responseTokens.map((t) => normalizeToken(t));
        } else {
          allParsedTokens = Object.entries(responseTokens).flatMap(
            ([queueType, queueTokens]) =>
              Array.isArray(queueTokens)
                ? queueTokens.map((token) => normalizeToken(token, queueType))
                : []
          );
        }

        setWaitingTokens(allParsedTokens.filter((t) => t.status === "waiting"));
        setPendingArrivals(allParsedTokens.filter((t) => t.status === "called" || t.status === "im-here"));
        setSecondsAgo(0);
      }
    } catch (err) {
      console.error("Dashboard init error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // =====================================================
  // REAL-TIME SOCKET.IO ENGINE (Fixed Immutable State Sync)
  // =====================================================
  useEffect(() => {
    if (!shop?.id) return;

    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Staff socket connected:", socket.id);
      socket.emit("join-shop", shop.id);
    });

    // Helper to extract and normalize token from any socket payload variant
    const extractToken = (data) => {
      const raw = data?.token ?? data?.data?.token ?? data?.data ?? data;
      return raw?.id ? normalizeToken(raw) : null;
    };

    // 1. Token Called Event
    socket.on("token:called", (data) => {
      const normalized = extractToken(data);
      if (!normalized) return;

      setWaitingTokens((prev) => prev.filter((t) => t.id !== normalized.id));
      setPendingArrivals((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [...filtered, normalized];
      });
      setSecondsAgo(0);
    });

    // 2. Token Im-Here Event (Instant Status Update)
    socket.on("token:im-here", (data) => {
      const normalized = extractToken(data);
      if (!normalized) return;

      setPendingArrivals((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [...filtered, normalized];
      });
      setSecondsAgo(0);
    });

    // 3. Audio Bell Chime
    socket.on("token:bell", () => {
      playBellChime();
    });

    // 4. Arrival Status Updated (Arrived / Not Arrived)
    socket.on("token:arrival-status", (data) => {
      const normalized = extractToken(data);
      if (!normalized) return;

      setPendingArrivals((prev) => prev.filter((t) => t.id !== normalized.id));
      setWaitingTokens((prev) => prev.filter((t) => t.id !== normalized.id));
      setSecondsAgo(0);
    });

    // 5. Timeout Event
    socket.on("token:timeout", (data) => {
      const normalized = extractToken(data);
      if (!normalized) return;

      setPendingArrivals((prev) => prev.filter((t) => t.id !== normalized.id));
      setSecondsAgo(0);
    });

    // 6. New Token Created
    socket.on("token:created", (data) => {
      const normalized = extractToken(data);
      if (!normalized) return;

      if (normalized.status === "waiting") {
        setWaitingTokens((prev) => {
          if (prev.some((t) => t.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [shop?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const countsMap = { Q2: 0, Q4: 0, Q6: 0, Q8: 0 };
    waitingTokens.forEach((t) => {
      if (countsMap[t.queue_type] !== undefined) {
        countsMap[t.queue_type]++;
      }
    });
    return countsMap;
  }, [waitingTokens]);

  const toggleQueue = useCallback((queue) => {
    if (queue === "ALL") {
      setSelectedQueues(["ALL"]);
      return;
    }
    setSelectedQueues((prev) => {
      let updated = prev.filter((q) => q !== "ALL");
      if (updated.includes(queue)) {
        updated = updated.filter((q) => q !== queue);
      } else {
        updated.push(queue);
      }
      return updated.length === 0 ? ["ALL"] : updated;
    });
  }, []);

  const isQueueVisible = useCallback(
    (queue) => selectedQueues.includes("ALL") || selectedQueues.includes(queue),
    [selectedQueues]
  );

  const handleCallNext = useCallback(async (queueType) => {
    const queueTokens = waitingTokens
      .filter((t) => t.queue_type === queueType)
      .sort((a, b) => Number(a.token_no) - Number(b.token_no));

    if (queueTokens.length === 0) {
      setPopup({
        open: true,
        title: "Queue Empty",
        message: "There are no waiting customers in this queue.",
      });
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/tokens/shop/${shop.id}/call-next`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queueType,
            staffName: staff?.name || user?.name || null,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to call next token.");
      }
    } catch (err) {
      console.error("Call next token error:", err);
      setPopup({ open: true, title: "Error", message: err.message || "Unable to call next token." });
      fetchDashboardData();
    }
  }, [waitingTokens, shop?.id, staff?.name, user?.name, fetchDashboardData]);

  const updateArrivalStatus = useCallback(async (tokenId, status) => {
    setPendingArrivals((prev) => prev.filter((t) => t.id !== tokenId));

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/tokens/${tokenId}/arrival-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update arrival status.");
      }
    } catch (err) {
      console.error(`Update token status error:`, err);
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  const handleLogout = useCallback(() => {
    setWaitingTokens([]);
    setPendingArrivals([]);
    if (logout) {
      logout();
    } else {
      localStorage.clear();
      window.location.href = "/login";
    }
  }, [logout]);

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

  const queuesList = [
    { key: "Q2", name: "Queue 2 Persons", color: "orange" },
    { key: "Q4", name: "Queue 4 Persons", color: "emerald" },
    { key: "Q6", name: "Queue 6 Persons", color: "blue" },
    { key: "Q8", name: "Queue 8 Persons", color: "purple" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !staff || !shop) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm px-6 py-5 text-center max-w-md w-full">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-base font-bold text-slate-900">Unable to Load Dashboard</h2>
          <p className="text-sm text-slate-500 mt-2">{error || "Staff profile data not found."}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 h-10 px-5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800 font-sans flex flex-col">
      <header className="w-full bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-extrabold tracking-wider mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE COUNTER SOCKET CONNECTED
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
            {shop.name}
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Counter Staff: <strong className="text-slate-700">{staff.name}</strong>
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="flex flex-col items-start md:items-end text-xs text-slate-400">
            <span>
              {secondsAgo === 0
                ? "Updated just now"
                : secondsAgo < 60
                  ? `Updated ${secondsAgo} sec ago`
                  : `Updated ${Math.floor(secondsAgo / 60)} min ago`}
            </span>
            <span className="text-slate-600 font-semibold">{date} • {time}</span>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="h-10 px-5 border border-red-200 rounded-lg bg-white text-red-600 text-xs font-bold tracking-wide hover:bg-red-600 hover:text-white transition-colors duration-200 shadow-sm"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-48 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-3 md:p-5 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:gap-1 sticky top-[73px] md:top-[81px] z-20">
          <div className="hidden md:block text-[11px] font-extrabold text-slate-400 tracking-wider uppercase px-3 mb-2">
            Queues
          </div>

          <button
            onClick={() => toggleQueue("ALL")}
            className={`flex-shrink-0 md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
              selectedQueues.includes("ALL") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>ALL</span>
          </button>

          {queuesList.map((q) => (
            <button
              key={q.key}
              onClick={() => toggleQueue(q.key)}
              className={`flex-shrink-0 md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedQueues.includes(q.key) ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full bg-${q.color}-500`} />
              <span>{q.key}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl">
          <div className="flex flex-col gap-6">
            {queuesList.map(
              (q) =>
                isQueueVisible(q.key) && (
                  <div key={q.key} className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-black text-xs">
                          {q.key}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-800">{q.name}</h2>
                          <p className="text-xs text-slate-400">Manage queue tokens</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 px-3 bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Waiting</span>
                          <strong className="text-lg font-black">{counts[q.key]}</strong>
                        </div>

                        <button
                          onClick={() => handleCallNext(q.key)}
                          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                        >
                          CALL NEXT
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                          Next in Line
                        </span>
                        <small className="text-[10px] text-slate-400">
                          {waitingTokens.filter((t) => t.queue_type === q.key).length} Remaining
                        </small>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {waitingTokens
                          .filter((t) => t.queue_type === q.key)
                          .map((token) => (
                            <div key={token.id} className="min-w-0 border border-slate-200 rounded-lg bg-white p-3 text-xs shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <strong className="text-sm font-bold text-slate-800">Token {token.token_no}</strong>
                                <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                                  {token.status || "waiting"}
                                </span>
                              </div>
                              <p className="mt-1 truncate font-semibold text-slate-700">{token.customer_name}</p>
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                {token.group_size != null && <span>{token.group_size} people</span>}
                              </div>
                            </div>
                          ))}

                        {waitingTokens.filter((t) => t.queue_type === q.key).length === 0 && (
                          <div className="col-span-full text-xs text-slate-400 italic">No tokens waiting</div>
                        )}
                      </div>
                    </div>

                    {/* PENDING ARRIVALS / CALLED / IM-HERE SECTION */}
                    <div className="p-4">
                      <h3 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase mb-3">
                        Currently Called / Pending Arrival
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pendingArrivals
                          .filter((t) => t.queue_type === q.key)
                          .map((token) => {
                            const isImHere = token.status === "im-here";
                            return (
                              <div key={token.id} className={`p-3 border rounded-lg flex flex-col justify-between gap-3 shadow-2xs ${isImHere ? 'border-emerald-300 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/30'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="grid grid-cols-3 gap-2 text-xs flex-1">
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400">TOKEN</span>
                                      <strong className="text-base text-blue-600">{token.token_no}</strong>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400">CUSTOMER</span>
                                      <strong className="text-slate-700 truncate block">{token.customer_name}</strong>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400">GROUP SIZE</span>
                                      <strong className="text-slate-700">{token.group_size ?? "-"}</strong>
                                    </div>
                                  </div>

                                  <div>
                                    {isImHere ? (
                                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-xs animate-bounce">
                                        🙋‍♂️ I'M HERE!
                                      </span>
                                    ) : (
                                      <CallTimer expiresAt={token.expiresAt} calledAt={token.calledAt} />
                                    )}
                                  </div>
                                </div>

                                {isImHere ? (
                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 animate-fade-in">
                                    <button
                                      onClick={() => updateArrivalStatus(token.id, "arrived")}
                                      className="flex-1 h-9 border border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 rounded-md text-xs font-bold transition-all shadow-xs"
                                    >
                                      ARRIVED
                                    </button>

                                    <button
                                      onClick={() => updateArrivalStatus(token.id, "not_arrived")}
                                      className="flex-1 h-9 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 rounded-md text-xs font-bold transition-all"
                                    >
                                      NOT ARRIVED
                                    </button>
                                  </div>
                                ) : (
                                  <div className="pt-2 border-t border-slate-200 text-center">
                                    <span className="text-[11px] font-semibold text-amber-700">
                                      ⏳ Waiting for customer to confirm arrival...
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {pendingArrivals.filter((t) => t.queue_type === q.key).length === 0 && (
                          <div className="col-span-full p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                            No tokens called yet for this queue.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl text-center space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Logout</h3>
            <p className="text-xs text-slate-500">Kya aap logout karna chahte hain?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 h-10 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 h-10 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {popup.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl text-center space-y-3">
            <div className="text-2xl">⚠️</div>
            <h3 className="text-base font-bold text-slate-900">{popup.title}</h3>
            <p className="text-xs text-slate-500">{popup.message}</p>
            <button
              onClick={() => setPopup({ open: false, title: "", message: "" })}
              className="w-full h-10 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}