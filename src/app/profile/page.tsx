"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Bucket where the booking flow uploads the UPI payment screenshots
// Inside src/app/profile/page.tsx
const PAYMENT_BUCKET = "payment_proofs";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting Verification",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

// Dynamic Tabs based on Role
const USER_TABS = [
  { key: "overview", label: "Overview" },
  { key: "bookings", label: "My Bookings" },
  { key: "history", label: "Past Treks" },
  { key: "roster", label: "Saved Roster" },
  { key: "account", label: "Account Details" },
];

const ADMIN_TABS = [
  { key: "admin_overview", label: "Admin Portal" },
  { key: "account", label: "Account Details" },
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // User Data State
  const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Admin Data State (for quick metrics)
  const [adminStats, setAdminStats] = useState({ pendingBookings: 0, activeTreks: 0 });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Form States
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [healthNotes, setHealthNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountMobile, setAccountMobile] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ text: "", type: "" });
  const [bookingFilter, setBookingFilter] = useState("ALL");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        setAccountName(profileData.full_name ?? "");
        setAccountMobile(profileData.mobile_number ?? "");

        if (profileData.role === "admin") {
          setActiveTab("admin_overview"); // Switch default tab for admins
          
          // Fetch quick stats for Admin Dashboard
          const [pendingRes, treksRes] = await Promise.all([
            supabase.from("bookings").select("id", { count: 'exact' }).eq("booking_status", "PENDING"),
            supabase.from("treks").select("id", { count: 'exact' }).eq("status", "UPCOMING")
          ]);
          setAdminStats({
            pendingBookings: pendingRes.count || 0,
            activeTreks: treksRes.count || 0
          });
        } else {
          // Fetch regular user data
          const [passengerRes, bookingRes] = await Promise.all([
            supabase.from("saved_passengers").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
            supabase.from("bookings").select("*, treks(*), passengers(*)").eq("user_id", session.user.id).order("created_at", { ascending: false }),
          ]);
          if (passengerRes.data) setSavedPassengers(passengerRes.data);
          if (bookingRes.data) setBookings(bookingRes.data);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const { upcomingBookings, pastBookings, stats, nextTrek } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const seatsOf = (b: any) => Math.max(b.passengers?.length ?? 0, 1);
    const isPast = (b: any) => !b.treks || new Date(b.treks.start_date) < today;

    const upcoming = bookings.filter((b) => !isPast(b) && b.booking_status !== "CANCELLED").sort((a, b) => new Date(a.treks.start_date).getTime() - new Date(b.treks.start_date).getTime());
    const past = bookings.filter((b) => isPast(b) && b.booking_status === "CONFIRMED").sort((a, b) => new Date(b.treks?.start_date ?? 0).getTime() - new Date(a.treks?.start_date ?? 0).getTime());
    const totalSpent = bookings.filter((b) => b.booking_status === "CONFIRMED").reduce((sum, b) => sum + (b.treks?.amount ?? 0) * seatsOf(b), 0);

    return {
      upcomingBookings: upcoming,
      pastBookings: past,
      nextTrek: upcoming.find((b) => b.booking_status === "CONFIRMED") ?? upcoming[0] ?? null,
      stats: {
        completed: past.length,
        upcoming: upcoming.filter((b) => b.booking_status === "CONFIRMED").length,
        pending: bookings.filter((b) => b.booking_status === "PENDING").length,
        totalSpent,
        seats: bookings.filter((b) => b.booking_status === "CONFIRMED").reduce((sum, b) => sum + seatsOf(b), 0),
      },
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "ALL") return bookings;
    return bookings.filter((b) => b.booking_status === bookingFilter);
  }, [bookings, bookingFilter]);

  const daysUntil = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAddPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const { data, error } = await supabase
        .from("saved_passengers")
        .insert([
          {
            user_id: user.id,
            full_name: fullName,
            age: parseInt(age),
            gender,
            health_or_disability_notes: healthNotes
          }
        ])
        .select();

      if (error) throw error;

      if (data) setSavedPassengers([data[0], ...savedPassengers]);

      // Clear form
      setFullName(""); setAge(""); setGender("Male"); setHealthNotes("");

    } catch (error: any) {
      console.error("Error adding passenger:", error.message);
      alert("Failed to save passenger.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePassenger = async (id: string) => {
    if (!confirm("Are you sure you want to remove this passenger from your roster?")) return;

    await supabase.from("saved_passengers").delete().eq("id", id);
    setSavedPassengers(savedPassengers.filter(p => p.id !== id));
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAccount(true);
    setAccountMessage({ text: "", type: "" });

    try {
      // `role` is deliberately never sent — only an admin may change it
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: accountName,
            mobile_number: accountMobile,
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setAccountMessage({ text: "Your details have been updated.", type: "success" });
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      setAccountMessage({ text: error.message, type: "error" });
    } finally {
      setIsSavingAccount(false);
    }
  };

  // A booking can only be pulled back by the trekker while it's still unverified
  const handleCancelBooking = async (id: string) => {
    if (!confirm("Cancel this booking request? You will need to book again to rejoin this trek.")) return;

    const { error } = await supabase
      .from("bookings")
      .update({ booking_status: "CANCELLED" })
      .eq("id", id);

    if (error) {
      alert("Could not cancel this booking. Please contact your coordinator.");
      return;
    }

    setBookings(bookings.map(b => (b.id === id ? { ...b, booking_status: "CANCELLED" } : b)));
  };

  const handleViewPaymentProof = async (path: string) => {
    const { data, error } = await supabase.storage.from(PAYMENT_BUCKET).createSignedUrl(path, 60);

    if (error || !data) {
      alert("Could not open the payment screenshot.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh(); // <-- This forces Next.js to clear the cached page state instantly
  };

  const handleReuseRoster = () => setActiveTab("roster");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">Loading your profile...</div>;
  }

  const displayName = profile?.full_name || user?.email;
  const avatarLetter = (profile?.full_name || user?.email || "?").charAt(0).toUpperCase();
  const currentTabs = profile?.role === "admin" ? ADMIN_TABS : USER_TABS;

  const renderBookingCard = (b: any, options: { showActions?: boolean } = {}) => (
    <div key={b.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 h-32 sm:h-auto bg-gray-100 shrink-0">
          {b.treks?.cover_image_url ? (
            <img src={b.treks.cover_image_url} alt={b.treks.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
          )}
        </div>

        <div className="flex-grow p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{b.treks?.title ?? "Trek unavailable"}</h3>
              {b.treks && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(b.treks.start_date)}
                  {b.treks.meeting_point ? ` · ${b.treks.meeting_point}` : ""}
                </p>
              )}
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wide ${STATUS_STYLES[b.booking_status]}`}>
              {STATUS_LABELS[b.booking_status]}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-y border-gray-100 py-3 mb-3">
            <div>
              <p className="text-gray-500">Trekkers</p>
              <p className="font-bold text-slate-900">{b.passengers?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-bold text-slate-900">
                ₹{(b.treks?.amount ?? 0) * Math.max(b.passengers?.length ?? 0, 1)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">UTR</p>
              <p className="font-mono text-xs text-slate-900 break-all">{b.utr_number}</p>
            </div>
          </div>

          {b.passengers?.length > 0 && (
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-semibold text-slate-900">On this trek: </span>
              {b.passengers.map((p: any) => `${p.full_name} (${p.age})`).join(", ")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
            {b.treks && (
              <Link href={`/trek/${b.trek_id}`} className="text-slate-900 hover:text-yellow-600 transition">
                View Trek
              </Link>
            )}
            {b.payment_screenshot_path && (
              <button
                onClick={() => handleViewPaymentProof(b.payment_screenshot_path)}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Payment Proof
              </button>
            )}
            {/* --- NEW: WhatsApp Group Button --- */}
            {b.booking_status === "CONFIRMED" && b.treks?.whatsapp_group_link && (
              <a
                href={b.treks.whatsapp_group_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold py-2 px-4 rounded-lg transition ml-auto shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                Join WhatsApp Group
              </a>
            )}
            {options.showActions && b.booking_status === "PENDING" && (
              <button
                onClick={() => handleCancelBooking(b.id)}
                className="text-red-500 hover:text-red-700 transition ml-auto"
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-20">

      {/* Profile Header */}
      <div className="bg-slate-900 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="h-24 w-24 bg-yellow-500 rounded-full flex items-center justify-center text-4xl font-black text-slate-900 border-4 border-slate-800 shadow-xl shrink-0">
            {avatarLetter}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{displayName}</h1>
              {profile?.role === "admin" && (
                <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-400">{user?.email}</p>
            {profile?.created_at && (
              <p className="text-gray-500 text-sm mt-1">Trekking with us since {formatDate(profile.created_at)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {profile?.role !== "admin" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Treks Completed", value: stats.completed },
              { label: "Upcoming Treks", value: stats.upcoming },
              { label: "Pending Approvals", value: stats.pending },
              { label: "Total Spent", value: `₹${stats.totalSpent}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col gap-2 lg:sticky lg:top-28">
              {currentTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-left px-4 py-3 rounded-xl font-medium transition ${
                    activeTab === tab.key
                      ? "bg-slate-50 text-slate-900 font-bold border-l-4 border-yellow-500"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {tab.key === "bookings" && bookings.length > 0 && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bookings.length}</span>}
                  {tab.key === "roster" && savedPassengers.length > 0 && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{savedPassengers.length}</span>}
                </button>
              ))}

              <button
                onClick={handleSignOut}
                className="text-left px-4 py-3 rounded-xl text-red-500 font-medium hover:bg-red-50 transition mt-2 border-t border-gray-100 pt-4"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">

            {activeTab === "admin_overview" && profile?.role === "admin" && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to Command Center</h2>
                <p className="text-gray-500 mb-8">Manage the entire GT Adventures platform from here.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-center">
                    <p className="text-3xl font-black text-blue-700">{adminStats.activeTreks}</p>
                    <p className="text-sm font-bold text-blue-600 uppercase mt-1">Active Treks</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl text-center">
                    <p className="text-3xl font-black text-amber-700">{adminStats.pendingBookings}</p>
                    <p className="text-sm font-bold text-amber-600 uppercase mt-1">Pending Verifications</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Link href="/admin/bookings" className="flex items-center justify-between bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-xl transition">
                    <div>
                      <h3 className="font-bold text-lg">Verify Bookings</h3>
                      <p className="text-sm text-gray-400">Approve payments and manage incoming reservations.</p>
                    </div>
                    <span className="text-xl">➔</span>
                  </Link>

                  <Link href="/admin/add-trek" className="flex items-center justify-between border border-gray-200 hover:bg-gray-50 text-slate-900 p-5 rounded-xl transition">
                    <div>
                      <h3 className="font-bold text-lg">Trek Catalog Manager</h3>
                      <p className="text-sm text-gray-500">Add new treks, update rosters, and mark summits completed.</p>
                    </div>
                    <span className="text-xl">➔</span>
                  </Link>

                  <Link href="/admin/leads" className="flex items-center justify-between border border-gray-200 hover:bg-gray-50 text-slate-900 p-5 rounded-xl transition">
                    <div>
                      <h3 className="font-bold text-lg">Corporate Leads</h3>
                      <p className="text-sm text-gray-500">Manage B2B quote requests and follow-ups.</p>
                    </div>
                    <span className="text-xl">➔</span>
                  </Link>

                  <Link href="/admin/add-blog" className="flex items-center justify-between border border-gray-200 hover:bg-gray-50 text-slate-900 p-5 rounded-xl transition">
                    <div>
                      <h3 className="font-bold text-lg">Content Editor</h3>
                      <p className="text-sm text-gray-500">Write and publish SEO blog posts.</p>
                    </div>
                    <span className="text-xl">➔</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ---------------- OVERVIEW ---------------- */}
            {activeTab === "overview" && profile?.role !== "admin" && (
              <>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Your Next Adventure</h2>

                  {!nextTrek ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="mb-4">No upcoming treks booked yet.</p>
                      <Link href="/" className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition">
                        Explore Upcoming Treks
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <div className="relative h-40 bg-slate-900">
                        {nextTrek.treks?.cover_image_url && (
                          <img
                            src={nextTrek.treks.cover_image_url}
                            alt={nextTrek.treks.title}
                            className="w-full h-full object-cover opacity-70"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                        <div className="absolute bottom-4 left-5 right-5">
                          <h3 className="text-2xl font-bold text-white">{nextTrek.treks?.title}</h3>
                          <p className="text-gray-300 text-sm">{formatDate(nextTrek.treks.start_date)}</p>
                        </div>
                        <div className="absolute top-4 right-4 bg-yellow-500 text-black font-black px-4 py-2 rounded-xl text-center leading-tight">
                          <span className="block text-2xl">{Math.max(daysUntil(nextTrek.treks.start_date), 0)}</span>
                          <span className="text-[10px] uppercase tracking-wide">Days to go</span>
                        </div>
                      </div>

                      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-bold text-slate-900">{STATUS_LABELS[nextTrek.booking_status]}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Meeting Point</p>
                          <p className="font-bold text-slate-900 line-clamp-1">{nextTrek.treks?.meeting_point || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Meeting Time</p>
                          <p className="font-bold text-slate-900">{nextTrek.treks?.meeting_time || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Trekkers</p>
                          <p className="font-bold text-slate-900">{nextTrek.passengers?.length ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Recent Bookings</h2>
                    {bookings.length > 3 && (
                      <button onClick={() => setActiveTab("bookings")} className="text-sm font-bold text-slate-600 hover:text-slate-900 transition">
                        View all
                      </button>
                    )}
                  </div>

                  {bookings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      You haven't booked a trek with us yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {bookings.slice(0, 3).map((b) => renderBookingCard(b))}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Trekking Summary</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-2xl font-black text-slate-900">{stats.seats}</p>
                      <p className="text-sm text-gray-500">Seats Confirmed</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-2xl font-black text-slate-900">{savedPassengers.length}</p>
                      <p className="text-sm text-gray-500">Saved Co-Trekkers</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
                      <p className="text-sm text-gray-500">Total Bookings</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---------------- MY BOOKINGS ---------------- */}
            {activeTab === "bookings" && profile?.role !== "admin" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">My Bookings</h2>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setBookingFilter(status)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                        bookingFilter === status
                          ? "bg-slate-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status === "ALL" ? "All" : STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>

                {/* Single List - No more split headers */}
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    No bookings found in this category.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredBookings.map((b) => renderBookingCard(b, { showActions: true }))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- PAST TREKS ---------------- */}
            {activeTab === "history" && profile?.role !== "admin" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Past Treks</h2>
                <p className="text-gray-500 text-sm mb-6">Every summit you've stood on with GT Adventures.</p>

                {pastBookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    Your trekking history is empty for now. Your first summit is waiting!
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {pastBookings.map((b) => (
                      <div key={b.id} className="flex gap-4">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mt-2" />
                          <div className="w-px flex-grow bg-gray-200 my-1" />
                        </div>
                        <div className="flex-grow pb-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                            {formatDate(b.treks.start_date)}
                          </p>
                          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <h3 className="font-bold text-slate-900">{b.treks.title}</h3>
                              <span className="text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wide bg-slate-100 text-slate-600 border-slate-200">
                                {b.treks.difficulty_level || "Moderate"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {b.passengers?.length ?? 0} trekker{(b.passengers?.length ?? 0) === 1 ? "" : "s"}
                              {b.treks.duration ? ` · ${b.treks.duration}` : ""}
                              {` · ₹${(b.treks.amount ?? 0) * Math.max(b.passengers?.length ?? 0, 1)}`}
                            </p>
                            <Link href={`/trek/${b.trek_id}`} className="inline-block mt-3 text-sm font-bold text-slate-900 hover:text-yellow-600 transition">
                              Revisit Trek
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- SAVED ROSTER ---------------- */}
            {activeTab === "roster" && profile?.role !== "admin" && (
              <>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Add a Co-Trekker</h2>
                  <form onSubmit={handleAddPassenger} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text" required placeholder="Full Name"
                      className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black"
                      value={fullName} onChange={(e) => setFullName(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number" required placeholder="Age"
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black w-full"
                        value={age} onChange={(e) => setAge(e.target.value)}
                      />
                      <select
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black bg-white w-full"
                        value={gender} onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <input
                      type="text" placeholder="Health or Disability Notes (Optional)"
                      className="sm:col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black"
                      value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)}
                    />
                    <button
                      type="submit" disabled={isAdding}
                      className="sm:col-span-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isAdding ? "Saving..." : "Save to Roster"}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">My Roster</h2>

                  {savedPassengers.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      You haven't saved any passengers yet. Add them above for quicker checkout later!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {savedPassengers.map((p) => (
                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-bold text-slate-900">{p.full_name} <span className="text-sm font-normal text-gray-500 ml-2">({p.age} Yrs, {p.gender})</span></p>
                            {p.health_or_disability_notes && (
                              <p className="text-sm text-red-500 mt-1">Note: {p.health_or_disability_notes}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeletePassenger(p.id)}
                            className="mt-3 sm:mt-0 text-red-500 text-sm font-bold hover:text-red-700 transition"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ---------------- ACCOUNT DETAILS ---------------- */}
            {activeTab === "account" && (
              <>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Account Details</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Coordinators use these details to reach you before a trek.
                  </p>

                  {accountMessage.text && (
                    <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                      accountMessage.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}>
                      {accountMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                      <input
                        type="email" value={user?.email ?? ""} disabled
                        className="w-full border border-gray-200 bg-gray-100 p-3 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text" required placeholder="Your full name"
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black"
                        value={accountName} onChange={(e) => setAccountName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel" required placeholder="10-digit mobile number"
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black"
                        value={accountMobile} onChange={(e) => setAccountMobile(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit" disabled={isSavingAccount}
                      className="sm:col-span-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingAccount ? "Saving..." : "Save Details"}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleReuseRoster}
                      className="flex-1 border border-gray-300 text-slate-900 font-bold py-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      Manage Saved Roster
                    </button>
                    <Link
                      href="/"
                      className="flex-1 text-center border border-gray-300 text-slate-900 font-bold py-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      Browse Treks
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 border border-red-200 text-red-600 font-bold py-3 rounded-lg hover:bg-red-50 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
