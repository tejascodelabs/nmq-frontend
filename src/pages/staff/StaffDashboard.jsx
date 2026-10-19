import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/auth.store";
import { socket } from "../../utils/socket";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function StaffDashboard() {
  const { user, logout } = useAuthStore();
  const [staffProfile, setStaffProfile] = useState(null);
  const [shopProfile, setShopProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // UI States for filtering queues and viewing data
  const [selectedQueues, setSelectedQueues] = useState(["ALL"]);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [timerNow, setTimerNow] = useState(Date.now());
  const CALL_TIMEOUT_SECONDS = 120;

  const currentDate = new Date();
  const date = currentDate.toLocaleDateString();
  const time = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const queuesList = [
    { key: "Q2", name: "Queue 2 Persons", color: "orange" },
    { key: "Q4", name: "Queue 4 Persons", color: "emerald" },
    { key: "Q6", name: "Queue 6 Persons", color: "blue" },
    { key: "Q8", name: "Queue 8 Persons", color: "purple" },
  ];

  // Calculate dynamic waiting counts per queue
  const counts = queuesList.reduce((acc, q) => {
    acc[q.key] = waitingTokens.filter((t) => {
      const qType = (t.queue_type || t.queueType || "").toUpperCase();
      return qType === q.key;
    }).length;
    return acc;
  }, {});

  // Refresh the per-token countdown only while a called token still needs a response.
  useEffect(() => {
    const hasActiveCountdown = pendingArrivals.some((token) => {
      const status = String(token.status || "").toLowerCase();
      if (status !== "called") return false;
      const startedAt = Number(token._callStartedAt) || Date.parse(token.calledAt || token.called_at || "");
      return startedAt && (timerNow - startedAt) < CALL_TIMEOUT_SECONDS * 1000;
    });

    if (!hasActiveCountdown) return;
    const interval = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [pendingArrivals, timerNow]);

  const addCallTimer = (token) => {
    const parsedCalledAt = Date.parse(token?.calledAt || token?.called_at || "");
    return {
      ...token,
      _callStartedAt: Number(token?._callStartedAt) || (Number.isFinite(parsedCalledAt) ? parsedCalledAt : Date.now()),
    };
  };

  const toggleQueue = (queueKey) => {
    if (queueKey === "ALL") {
      setSelectedQueues(["ALL"]);
    } else {
      let updated = selectedQueues.filter((k) => k !== "ALL");
      if (updated.includes(queueKey)) {
        updated = updated.filter((k) => k !== queueKey);
      } else {
        updated.push(queueKey);
      }
      if (updated.length === 0) updated = ["ALL"];
      setSelectedQueues(updated);
    }
  };

  const isQueueVisible = (queueKey) => {
    return selectedQueues.includes("ALL") || selectedQueues.includes(queueKey);
  };

  // 1. Fetch staff profile and shop details on load with Bearer token
  useEffect(() => {
    const fetchStaffProfile = async () => {
      if (!user?.id) return;
      try {
        setLoadingProfile(true);
        const token = useAuthStore.getState().token || localStorage.getItem("accessToken");

        const res = await fetch(`${BASE_URL}/staff/${user.id}/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const result = await res.json();
        
        if (result.success && result.data) {
          setStaffProfile(result.data.user);
          setShopProfile(result.data.shop);
        }
      } catch (err) {
        console.error("Error fetching staff profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchStaffProfile();
  }, [user?.id]);

  // 2. Fetch initial waiting tokens once shopProfile is loaded
  useEffect(() => {
    const fetchInitialTokens = async () => {
      if (!shopProfile?.id) return;
      try {
        const token = useAuthStore.getState().token || localStorage.getItem("accessToken");
        const res = await fetch(`${BASE_URL}/tokens/waiting?shopId=${shopProfile.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          }
        });
        const data = await res.json();
        if (data.success && data.tokens) {
          setWaitingTokens(data.tokens);
        }
      } catch (err) {
        console.error("Failed to load initial waiting tokens:", err);
      }
    };

    fetchInitialTokens();
  }, [shopProfile?.id]);

  // 3. Shared Socket.IO connection and shop-scoped live events.
  useEffect(() => {
    const shopId = shopProfile?.id ?? shopProfile?.shopId;
    if (shopId == null) return;

    const joinShop = () => {
      socket.emit("join-shop", { shopId: Number(shopId) });
    };

    const unwrapToken = (payload) => {
      const data = payload?.data ?? payload;
      return data?.token ?? data;
    };

    const handleNewToken = (payload) => {
      const token = unwrapToken(payload);
      if (Number(token?.shopId ?? token?.shop_id) !== Number(shopId)) return;
      if (token.status !== "waiting") return;

      setWaitingTokens((prev) => {
        if (prev.some((item) => String(item.id) === String(token.id))) return prev;
        return [...prev, token].sort(
          (a, b) => Number(a.tokenNo ?? a.token_no) - Number(b.tokenNo ?? b.token_no)
        );
      });
    };

    const handleTokenCancelled = (payload) => {
      const token = unwrapToken(payload);
      if (Number(token?.shopId ?? token?.shop_id) !== Number(shopId)) return;
      setWaitingTokens((prev) => prev.filter((item) => String(item.id) !== String(token.id)));
      setPendingArrivals((prev) => prev.filter((item) => String(item.id) !== String(token.id)));
    };

    const handleTokenCalled = (payload) => {
      const rawToken = unwrapToken(payload);
      if (Number(rawToken?.shopId ?? rawToken?.shop_id) !== Number(shopId)) return;
      const token = addCallTimer(rawToken);

      setWaitingTokens((prev) => prev.filter((item) => String(item.id) !== String(token.id)));
      setPendingArrivals((prev) => {
        if (prev.some((item) => String(item.id) === String(token.id))) {
          return prev.map((item) =>
            String(item.id) === String(token.id)
              ? { ...item, ...token, _callStartedAt: item._callStartedAt || token._callStartedAt }
              : item
          );
        }
        return [...prev, token];
      });
      setTimerNow(Date.now());
    };

    const handleTokenImHere = (payload) => {
      const rawToken = unwrapToken(payload);
      if (Number(rawToken?.shopId ?? rawToken?.shop_id) !== Number(shopId)) return;
      const token = { ...rawToken, status: rawToken.status || "imhere" };

      setPendingArrivals((prev) => {
        if (prev.some((item) => String(item.id) === String(token.id))) {
          return prev.map((item) =>
            String(item.id) === String(token.id) ? { ...item, ...token } : item
          );
        }
        return [...prev, token];
      });
      // status becomes imhere, so the 2-minute countdown stops and the buttons appear.
    };

    const handleArrivalUpdated = (payload) => {
      const token = unwrapToken(payload);
      if (Number(token?.shopId ?? token?.shop_id) !== Number(shopId)) return;
      setPendingArrivals((prev) => prev.filter((item) => String(item.id) !== String(token.id)));
      setWaitingTokens((prev) => prev.filter((item) => String(item.id) !== String(token.id)));
    };

    socket.on("connect", joinShop);
    socket.on("new_token_created", handleNewToken);
    socket.on("token_cancelled", handleTokenCancelled);
    socket.on("token_called", handleTokenCalled);
    socket.on("token_im_here", handleTokenImHere);
    socket.on("token_arrival_updated", handleArrivalUpdated);

    if (socket.connected) joinShop();

    return () => {
      socket.off("connect", joinShop);
      socket.off("new_token_created", handleNewToken);
      socket.off("token_cancelled", handleTokenCancelled);
      socket.off("token_called", handleTokenCalled);
      socket.off("token_im_here", handleTokenImHere);
      socket.off("token_arrival_updated", handleArrivalUpdated);
    };
  }, [shopProfile?.id, shopProfile?.shopId]);

  const handleCallNext = async (queueType) => {
    try {
      const token = useAuthStore.getState().token || localStorage.getItem("accessToken");

      const res = await fetch(`${BASE_URL}/tokens/call-next?shopId=${shopProfile?.id ?? shopProfile?.shopId}&queueType=${encodeURIComponent(queueType)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const calledToken = addCallTimer(data.data);
        setTimerNow(Date.now());
        setPendingArrivals((prev) => {
          if (prev.some((t) => String(t.id) === String(calledToken.id))) {
            return prev.map((t) => String(t.id) === String(calledToken.id)
              ? { ...t, ...calledToken, _callStartedAt: t._callStartedAt || calledToken._callStartedAt }
              : t);
          }
          return [...prev, calledToken];
        });
        setWaitingTokens((prev) => prev.filter((t) => t.id !== calledToken.id));
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error calling next token:", err);
    }
  };

  const updateArrivalStatus = async (tokenId, status) => {
    try {
      const token = useAuthStore.getState().token || localStorage.getItem("accessToken");

      const res = await fetch(`${BASE_URL}/tokens/${tokenId}/arrival-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingArrivals((prev) => prev.filter((t) => t.id !== tokenId));
      }
    } catch (err) {
      console.error("Error updating arrival status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="w-full bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-extrabold tracking-wider mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE COUNTER SOCKET CONNECTED
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
            {shopProfile?.name || "Loading Shop..."}
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Counter Staff: <strong className="text-slate-700">{staffProfile?.name || user?.name || "Staff"}</strong>
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="flex flex-col items-start md:items-end text-xs text-slate-400">
            <span className="text-slate-600 font-semibold">{date} • {time}</span>
          </div>

          <button
            onClick={logout}
            className="h-10 px-5 border border-red-200 rounded-lg bg-white text-red-600 text-xs font-bold tracking-wide hover:bg-red-600 hover:text-white transition-colors duration-200 shadow-sm"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* BODY LAYOUT: ASIDE + MAIN */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* ASIDE NAVIGATION */}
        <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-3 md:p-5 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:gap-1 shrink-0">
          <div className="hidden md:block text-[11px] font-extrabold text-slate-400 tracking-wider uppercase px-3 mb-2">
            Queues Filter
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
              <span>{q.name}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Queue Sections List */}
          <div className="flex flex-col gap-6">
            {queuesList.map(
              (q) =>
                isQueueVisible(q.key) && (
                  <div key={q.key} className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Queue Header & Call Next Button */}
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
                          CALL NEXT 📢
                        </button>
                      </div>
                    </div>

                    {/* Waiting Tokens Grid */}
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                          Next in Line
                        </span>
                        <small className="text-[10px] text-slate-400">
                          {waitingTokens.filter((t) => {
                            const qType = (t.queue_type || t.queueType || "").toUpperCase();
                            return qType === q.key;
                          }).length} Remaining
                        </small>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {waitingTokens
                          .filter((t) => {
                            const qType = (t.queue_type || t.queueType || "").toUpperCase();
                            return qType === q.key;
                          })
                          .map((token) => (
                            <div key={token.id} className="min-w-0 border border-slate-200 rounded-lg bg-white p-3 text-xs shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <strong className="text-sm font-bold text-slate-800">
                                  Token #{token.token_no || token.tokenNo}
                                </strong>
                                <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                                  {token.status || "waiting"}
                                </span>
                              </div>
                              <p className="mt-1 truncate font-semibold text-slate-700">
                                {token.customer_name || token.name}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                {(token.group_size != null || token.groupSize != null) && (
                                  <span>{token.group_size || token.groupSize} people</span>
                                )}
                              </div>
                            </div>
                          ))}

                        {waitingTokens.filter((t) => {
                          const qType = (t.queue_type || t.queueType || "").toUpperCase();
                          return qType === q.key;
                        }).length === 0 && (
                          <div className="col-span-full text-xs text-slate-400 italic py-2">No tokens waiting</div>
                        )}
                      </div>
                    </div>

                    {/* Pending Arrivals / Arrived / Not Arrived Section Scoped to this Queue */}
                    <div className="p-4">
                      <h3 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase mb-3">
                        Currently Called / Pending Arrival
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pendingArrivals
                          .filter((t) => {
                            const qType = (t.queue_type || t.queueType || "").toUpperCase();
                            return qType === q.key;
                          })
                          .map((token) => {
                            const isImHere = token.status === "imhere" || token.status === "im-here";
                            const callStartedAt = Number(token._callStartedAt) || Date.parse(token.calledAt || token.called_at || "");
                            const elapsedSeconds = callStartedAt ? Math.max(0, Math.floor((timerNow - callStartedAt) / 1000)) : 0;
                            const remainingSeconds = Math.max(0, CALL_TIMEOUT_SECONDS - elapsedSeconds);
                            const timerExpired = !isImHere && token.status === "called" && remainingSeconds <= 0;
                            const canFinalize = isImHere || timerExpired;
                            return (
                              <div
                                key={token.id}
                                className={`p-3 border rounded-lg flex flex-col justify-between gap-3 shadow-2xs ${
                                  isImHere ? "border-emerald-300 bg-emerald-50/40" : "border-amber-200 bg-amber-50/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="grid grid-cols-3 gap-2 text-xs flex-1">
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400">TOKEN</span>
                                      <strong className="text-base text-blue-600">{token.token_no || token.tokenNo}</strong>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400">CUSTOMER</span>
                                      <strong className="text-slate-700 truncate block">{token.customer_name || token.name}</strong>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] font-bold text-slate-400">GROUP SIZE</span>
                                      <strong className="text-slate-700">{token.group_size ?? token.groupSize ?? "-"}</strong>
                                    </div>
                                  </div>
                                </div>

                                {canFinalize ? (
                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                                    <button
                                      onClick={() => updateArrivalStatus(token.id, "arrived")}
                                      className="flex-1 h-9 border border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 rounded-md text-xs font-bold transition-all shadow-xs"
                                    >
                                      ARRIVED ✅
                                    </button>

                                    <button
                                      onClick={() => updateArrivalStatus(token.id, "not_arrived")}
                                      className="flex-1 h-9 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 rounded-md text-xs font-bold transition-all"
                                    >
                                      NOT ARRIVED ❌
                                    </button>
                                  </div>
                                ) : (
                                  <div className="pt-2 border-t border-slate-200 text-center">
                                    <span className="text-[11px] font-semibold text-amber-700">
                                      ⏳ No response yet — staff actions in {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {pendingArrivals.filter((t) => {
                          const qType = (t.queue_type || t.queueType || "").toUpperCase();
                          return qType === q.key;
                        }).length === 0 && (
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
    </div>
  );
}