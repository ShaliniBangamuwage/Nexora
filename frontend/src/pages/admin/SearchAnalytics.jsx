import { useState, useEffect } from "react";
import API_BASE_URL from "../../config/api";

export default function SearchAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    const initAuth = async () => {
      const { auth } = await import("../../services/firebase");
      if (auth.currentUser) {
        fetchAnalytics();
        return;
      }
      unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          fetchAnalytics();
          if (unsubscribe) unsubscribe();
        } else {
          setLoading(false);
        }
      });
    };
    initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const { auth } = await import("../../services/firebase");

      // Wait up to 5 s for auth to resolve if currentUser is not yet available
      const currentUser = auth.currentUser ?? await new Promise((resolve) => {
        const unsub = auth.onAuthStateChanged((u) => { unsub(); resolve(u); });
        setTimeout(() => resolve(null), 5000);
      });

      if (!currentUser) {
        setError("Not authenticated. Please log in as admin.");
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/admin/search/analytics`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Could not load analytics. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-sm px-6 py-5 text-red-600 text-sm font-medium mb-4 max-w-md text-center">
          {error}
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const maxCount = analytics?.topSearches?.[0]?.count || 1;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Page Header — matches Products.jsx header style */}
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Search Analytics
          </h1>
          <p className="text-slate-500 text-[15px]">
            Admin Dashboard — Search Insights
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchAnalytics}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-7">
        <div className="bg-white px-6 py-5 rounded-xl shadow-sm border-l-4 border-blue-400 flex justify-between items-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-sm text-slate-500 font-medium">
            Total Searches
          </span>
          <span className="text-3xl font-bold text-slate-800">
            {analytics?.totalSearches?.toLocaleString() || 0}
          </span>
        </div>

        <div className="bg-white px-6 py-5 rounded-xl shadow-sm border-l-4 border-slate-300 flex justify-between items-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-sm text-slate-500 font-medium">
            Unique Terms
          </span>
          <span className="text-3xl font-bold text-slate-800">
            {analytics?.topSearches?.length || 0}
          </span>
        </div>

        <div className="bg-white px-6 py-5 rounded-xl shadow-sm border-l-4 border-amber-400 flex justify-between items-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-sm text-slate-500 font-medium">
            Inventory Gaps
          </span>
          <span className="text-3xl font-bold text-slate-800">
            {analytics?.zeroResults?.length || 0}
          </span>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Searches Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 ">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Top Searched Terms
          </h2>

          {analytics?.topSearches?.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-lg text-slate-500 mb-2">No search data yet</p>
              <small className="text-sm text-slate-400">
                Start searching to see analytics
              </small>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics?.topSearches?.map((item, index) => (
                <div key={item.query}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 w-4">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-700 capitalize font-medium">
                        {item.query}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {item.count}x
                    </span>
                  </div>
                  <div className="ml-6 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Inventory Gaps */}
          <div className="bg-white rounded-xl shadow-sm p-6 ">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Inventory Gaps
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Searches that returned zero results — consider adding these
              products
            </p>

            {analytics?.zeroResults?.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-lg text-slate-500 mb-2">✓ No gaps found</p>
                <small className="text-sm text-slate-400">
                  Great inventory coverage!
                </small>
              </div>
            ) : (
              <div className="space-y-1">
                {analytics?.zeroResults?.map((item) => (
                  <div
                    key={item.query}
                    className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-sm text-slate-700 capitalize font-medium">
                      {item.query}
                    </span>
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-semibold">
                      {item.count} searches
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Last 7 Days Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 ">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Last 7 Days Activity
            </h2>

            {analytics?.last7Days?.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-lg text-slate-500 mb-2">
                  No recent activity
                </p>
                <small className="text-sm text-slate-400">
                  Check back after some searches
                </small>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.last7Days?.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-500 w-16 flex-shrink-0">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-400 h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((day.count / 20) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-6 text-right font-medium">
                        {day.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
