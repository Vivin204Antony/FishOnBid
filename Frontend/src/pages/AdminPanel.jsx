import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Users, Gavel, Activity, Trash2, XCircle,
    RefreshCw, Crown, Shield, UserCheck, Hammer,
    ShoppingBag, Sparkles, TrendingUp, Lock, Unlock
} from "lucide-react";

const API = "http://localhost:9090/api/admin";

/* ── Utility: badge config by userType ── */
const USER_TYPE_CONFIG = {
    "Auctioneer": {
        label: "Auctioneer",
        icon: Hammer,
        pill: "bg-amber-100 text-amber-700 border border-amber-200",
        desc: "Creates & lists fish auctions",
    },
    "Bidder": {
        label: "Bidder",
        icon: ShoppingBag,
        pill: "bg-blue-100 text-blue-700 border border-blue-200",
        desc: "Participates in bidding",
    },
    "Both": {
        label: "Auctioneer + Bidder",
        icon: Sparkles,
        pill: "bg-purple-100 text-purple-700 border border-purple-200",
        desc: "Creates auctions & also bids",
    },
    "Admin": {
        label: "Admin",
        icon: Shield,
        pill: "bg-slate-800 text-white border border-slate-700",
        desc: "Platform administrator",
    },
    "New User": {
        label: "New User",
        icon: UserCheck,
        pill: "bg-gray-100 text-gray-500 border border-gray-200",
        desc: "Registered, no activity yet",
    },
};

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-300 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold text-gray-800">{value ?? "—"}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function UserTypeBadge({ userType }) {
    const cfg = USER_TYPE_CONFIG[userType] || USER_TYPE_CONFIG["New User"];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
        </span>
    );
}

/* ── User Card ── */
function UserCard({ u, currentUserId, onRoleChange, onDelete }) {
    const cfg = USER_TYPE_CONFIG[u.userType] || USER_TYPE_CONFIG["New User"];
    const isAdmin = u.role === "ADMIN";
    const isSelf = u.id === currentUserId;

    return (
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isAdmin ? "bg-slate-800 text-white" : "bg-blue-100 text-blue-700"}`}>
                        {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                </div>
                {isAdmin && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" title="Admin" />}
            </div>

            {/* User type badge */}
            <div className="flex items-center gap-2 flex-wrap">
                <UserTypeBadge userType={u.userType} />
                {isSelf && (
                    <span className="text-[10px] text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 font-medium">You</span>
                )}
            </div>

            {/* Activity stats */}
            <div className="flex gap-3">
                <div className="flex-1 bg-amber-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-700">{u.auctionCount}</p>
                    <p className="text-[10px] text-amber-500 font-medium">Auctions Listed</p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-blue-700">{u.bidCount}</p>
                    <p className="text-[10px] text-blue-500 font-medium">Bids Placed</p>
                </div>
            </div>

            {/* Actions */}
            {!isSelf && (
                <div className="flex gap-2 pt-1">
                    {isAdmin ? (
                        <button
                            onClick={() => onRoleChange(u.id, "USER")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        >
                            <Lock className="w-3.5 h-3.5" /> Remove Admin
                        </button>
                    ) : (
                        <button
                            onClick={() => onRoleChange(u.id, "ADMIN")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                        >
                            <Unlock className="w-3.5 h-3.5" /> Make Admin
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(u.id)}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Auction Card ── */
function AuctionCard({ a, onClose, onDelete }) {
    const isLive = a.active && a.endTime && new Date(a.endTime) > new Date();
    const price = (a.currentPrice ?? a.startPrice ?? 0).toLocaleString("en-IN");
    return (
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-gray-800">{a.fishName}</p>
                    <p className="text-xs text-gray-400">{a.location || "—"}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {isLive ? "🟢 Live" : "Closed"}
                </span>
            </div>

            <div className="flex gap-3">
                <div className="flex-1 bg-teal-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-teal-700">₹{price}</p>
                    <p className="text-[10px] text-teal-500 font-medium">Current Price</p>
                </div>
                {a.freshnessScore != null && (
                    <div className="flex-1 bg-orange-50 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-bold text-orange-700">{a.freshnessScore}/100</p>
                        <p className="text-[10px] text-orange-500 font-medium">Freshness</p>
                    </div>
                )}
            </div>

            {a.sellerEmail && (
                <p className="text-xs text-gray-400 truncate">
                    <span className="font-medium text-gray-500">Auctioneer:</span> {a.sellerEmail}
                </p>
            )}

            <div className="flex gap-2 pt-1">
                {isLive && (
                    <button
                        onClick={() => onClose(a.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                    >
                        <XCircle className="w-3.5 h-3.5" /> Force Close
                    </button>
                )}
                <button
                    onClick={() => onDelete(a.id)}
                    className={`${isLive ? "" : "flex-1"} flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition`}
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
            </div>
        </div>
    );
}

/* ── Main AdminPanel ── */
export default function AdminPanel() {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");

    useEffect(() => {
        if (!user || user.role !== "ADMIN") navigate("/dashboard", { replace: true });
    }, [user, navigate]);

    const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    async function load() {
        setLoading(true); setError(null);
        try {
            const [sR, uR, aR] = await Promise.all([
                fetch(`${API}/stats`, { headers: authHeaders }),
                fetch(`${API}/users`, { headers: authHeaders }),
                fetch(`${API}/auctions`, { headers: authHeaders }),
            ]);
            if (!sR.ok || !uR.ok || !aR.ok) throw new Error("Failed to load admin data — are you logged in as ADMIN?");
            setStats(await sR.json());
            setUsers(await uR.json());
            setAuctions(await aR.json());
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    useEffect(() => { if (user?.role === "ADMIN") load(); }, []);

    function showFlash(msg) {
        setFlash(msg);
        setTimeout(() => setFlash(null), 3000);
    }

    async function changeRole(id, newRole) {
        const r = await fetch(`${API}/users/${id}/role`, {
            method: "PUT", headers: authHeaders, body: JSON.stringify({ role: newRole })
        });
        if (r.ok) {
            setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole, userType: newRole === "ADMIN" ? "Admin" : (x.auctionCount > 0 && x.bidCount > 0 ? "Both" : x.auctionCount > 0 ? "Auctioneer" : x.bidCount > 0 ? "Bidder" : "New User") } : x));
            showFlash(`Role updated to ${newRole}`);
        }
    }

    async function deleteUser(id) {
        if (!window.confirm("Permanently delete this user?")) return;
        const r = await fetch(`${API}/users/${id}`, { method: "DELETE", headers: authHeaders });
        if (r.ok) { setUsers(u => u.filter(x => x.id !== id)); showFlash("User deleted"); }
    }

    async function closeAuction(id) {
        const r = await fetch(`${API}/auctions/${id}/close`, { method: "POST", headers: authHeaders });
        if (r.ok) { setAuctions(a => a.map(x => x.id === id ? { ...x, active: false } : x)); showFlash(`Auction #${id} closed`); }
    }

    async function deleteAuction(id) {
        if (!window.confirm("Permanently delete this auction?")) return;
        const r = await fetch(`${API}/auctions/${id}`, { method: "DELETE", headers: authHeaders });
        if (r.ok) { setAuctions(a => a.filter(x => x.id !== id)); showFlash("Auction deleted"); }
    }

    if (!user || user.role !== "ADMIN") return null;

    const typeOptions = ["All", "Auctioneer", "Bidder", "Both", "Admin", "New User"];

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "All" || u.userType === typeFilter;
        return matchSearch && matchType;
    });

    const filteredAuctions = auctions.filter(a =>
        (a.fishName || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.location || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.sellerEmail || "").toLowerCase().includes(search.toLowerCase())
    );

    const typeCount = (type) => users.filter(u => u.userType === type).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pt-8 pb-16 px-4">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-slate-600" /> Admin Panel
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Platform management · Signed in as <strong>{user?.name}</strong></p>
                    </div>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 shadow-sm transition"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* ── Flash / Error ── */}
                {flash && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-medium">
                        ✓ {flash}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                        ⚠ {error}
                    </div>
                )}

                {/* ── Stats ── */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
                        <StatCard icon={Gavel} label="All Auctions" value={stats.totalAuctions} color="bg-teal-500" />
                        <StatCard icon={Activity} label="Live Now" value={stats.liveAuctions} color="bg-green-500" sub="Active bidding" />
                        <StatCard icon={XCircle} label="Closed" value={stats.closedAuctions} color="bg-slate-500" />
                    </div>
                )}

                {/* ── User type summary pills ── */}
                {activeTab === "users" && (
                    <div className="flex flex-wrap gap-2">
                        {["Auctioneer", "Bidder", "Both", "Admin", "New User"].map(t => {
                            const cfg = USER_TYPE_CONFIG[t];
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(typeFilter === t ? "All" : t)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${typeFilter === t ? cfg.pill + " shadow" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t} <span className="opacity-60">({typeCount(t)})</span>
                                </button>
                            );
                        })}
                        {typeFilter !== "All" && (
                            <button onClick={() => setTypeFilter("All")} className="text-xs text-gray-400 hover:text-gray-600 px-2">
                                Clear ×
                            </button>
                        )}
                    </div>
                )}

                {/* ── Tabs + Search ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        {[
                            { id: "users", label: "Users", icon: Users, count: users.length },
                            { id: "auctions", label: "Auctions", icon: Gavel, count: auctions.length },
                        ].map(({ id, label, icon: Icon, count }) => (
                            <button
                                key={id}
                                onClick={() => { setActiveTab(id); setSearch(""); setTypeFilter("All"); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === id ? "bg-slate-800 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={activeTab === "users" ? "Search by name or email…" : "Search by fish, location, seller…"}
                        className="w-full sm:w-72 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-sm">Loading platform data…</div>
                ) : (
                    <>
                        {/* Users grid */}
                        {activeTab === "users" && (
                            filteredUsers.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 text-sm">No users match your filter.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredUsers.map(u => (
                                        <UserCard
                                            key={u.id}
                                            u={u}
                                            currentUserId={user?.id}
                                            onRoleChange={changeRole}
                                            onDelete={deleteUser}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Auctions grid */}
                        {activeTab === "auctions" && (
                            filteredAuctions.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 text-sm">No auctions match your search.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredAuctions.map(a => (
                                        <AuctionCard
                                            key={a.id}
                                            a={a}
                                            onClose={closeAuction}
                                            onDelete={deleteAuction}
                                        />
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
