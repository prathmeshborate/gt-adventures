"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TABS = [
  { key: "manage", label: "Manage Catalog" },
  { key: "form", label: "Add Trek" },
  { key: "roster", label: "Trek Roster", hidden: true }, // Hidden from sidebar, accessed via trek card
];

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-blue-50 text-blue-700 border-blue-200",
  ONGOING: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AdminTrekManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Data State
  const [treks, setTreks] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("manage");
  const [activeTrekForRoster, setActiveTrekForRoster] = useState<any>(null);

  // Add/Edit Form State (Same as before)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [amount, setAmount] = useState("");
  const [coordinatorDetails, setCoordinatorDetails] = useState("");
  const [difficulty, setDifficulty] = useState("Moderate");
  const [duration, setDuration] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [transportation, setTransportation] = useState("");
  const [mealsIncluded, setMealsIncluded] = useState("");
  const [maxSeats, setMaxSeats] = useState("30");
  const [whatsappLink, setWhatsappLink] = useState(""); // <-- ADD THIS
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Offline Booking Modal State
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineBookerName, setOfflineBookerName] = useState("");
  const [offlineBookerPhone, setOfflineBookerPhone] = useState("");
  const [offlinePaymentMode, setOfflinePaymentMode] = useState("CASH");
  const [offlinePassengers, setOfflinePassengers] = useState([{ name: "", age: "", gender: "Male" }]);
  const [isSavingOffline, setIsSavingOffline] = useState(false);

  // Completion Modal State
  const [completionModal, setCompletionModal] = useState({ isOpen: false, trekId: "", trekTitle: "" });
  const [completionNotes, setCompletionNotes] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (profileData?.role !== "admin") { alert("Access Denied."); router.push("/"); return; }
      setProfile(profileData);

      await fetchTreksAndBookings();
    };
    fetchAdminData();
  }, [router]);

  const fetchTreksAndBookings = async () => {
    const [treksRes, bookingsRes] = await Promise.all([
      supabase.from("treks").select("*").order("start_date", { ascending: false }),
      supabase.from("bookings").select("*, passengers(*), profiles(*)")
    ]);
    if (treksRes.data) setTreks(treksRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    setLoading(false);
  };

  const submitTrekCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleting(true);

    try {
      const uploadedUrls: string[] = [];
      
      // 1. Upload all selected gallery images to Supabase Storage
      for (const file of galleryFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery/${completionModal.trekId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from("trek_images").upload(fileName, file);
        if (!uploadError) {
          const { data } = supabase.storage.from("trek_images").getPublicUrl(fileName);
          uploadedUrls.push(data.publicUrl);
        }
      }

      // 2. Fetch current description to append the new post-trek notes
      const { data: currentTrek } = await supabase.from("treks").select("description").eq("id", completionModal.trekId).single();
      const newDescription = completionNotes 
        ? `${currentTrek?.description}\n\n--- Post Trek Notes ---\n${completionNotes}`
        : currentTrek?.description;

      // 3. Update the Trek in the database
      await supabase.from("treks").update({ 
        status: "COMPLETED",
        gallery_images: uploadedUrls,
        description: newDescription
      }).eq("id", completionModal.trekId);

      alert("Trek successfully marked as COMPLETED and added to the Wall of Fame!");
      setCompletionModal({ isOpen: false, trekId: "", trekTitle: "" });
      setCompletionNotes("");
      setGalleryFiles([]);
      await fetchTreksAndBookings();
    } catch (error: any) {
      alert("Error completing trek: " + error.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelTrek = async (id: string) => {
    if (window.confirm("Are you sure you want to CANCEL this trek?")) {
      await supabase.from("treks").update({ status: "CANCELLED" }).eq("id", id);
      await fetchTreksAndBookings();
    }
  };

  const stats = useMemo(() => {
    return {
      total: treks.length,
      upcoming: treks.filter(t => t.status === "UPCOMING").length,
      completed: treks.filter(t => t.status === "COMPLETED").length,
    };
  }, [treks]);

  const getSeatStats = (trekId: string, max: number) => {
    const confirmedBookings = bookings.filter(b => b.trek_id === trekId && b.booking_status === "CONFIRMED");
    const bookedCount = confirmedBookings.reduce((sum, b) => sum + (b.passengers?.length || 1), 0);
    const available = Math.max(max - bookedCount, 0);
    const percentFilled = (bookedCount / max) * 100;
    
    // Financial Split
    const onlineRevenue = confirmedBookings.filter(b => !b.utr_number?.startsWith("OFFLINE")).reduce((sum, b) => sum + ((b.treks?.amount || treks.find(t=>t.id===trekId)?.amount || 0) * (b.passengers?.length || 1)), 0);
    const offlineRevenue = confirmedBookings.filter(b => b.utr_number?.startsWith("OFFLINE")).reduce((sum, b) => sum + ((b.treks?.amount || treks.find(t=>t.id===trekId)?.amount || 0) * (b.passengers?.length || 1)), 0);

    return { bookedCount, available, percentFilled, confirmedBookings, onlineRevenue, offlineRevenue };
  };

  const handleEditTrek = (trek: any) => {
    setEditingId(trek.id); setTitle(trek.title); setDescription(trek.description); setStartDate(trek.start_date.split('T')[0]);
    setAmount(trek.amount.toString()); setCoordinatorDetails(trek.coordinator_details); setDifficulty(trek.difficulty_level);
    setDuration(trek.duration); setMeetingPoint(trek.meeting_point); setMeetingTime(trek.meeting_time);
    setTransportation(trek.transportation); setMealsIncluded(trek.meals_included); setMaxSeats(trek.max_seats.toString()); setWhatsappLink(trek.whatsapp_group_link || "");
    setExistingImageUrl(trek.cover_image_url); setImageFile(null); setMessage({ text: "", type: "" });
    setActiveTab("form");
  };

  const handleResetForm = () => {
    setEditingId(null); setTitle(""); setDescription(""); setStartDate(""); setAmount("");
    setCoordinatorDetails(""); setDifficulty("Moderate"); setDuration(""); setMeetingPoint("");
    setMeetingTime(""); setTransportation(""); setMealsIncluded(""); setMaxSeats("30"); setExistingImageUrl(""); setWhatsappLink(""); setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (Keep your exact handleSubmit logic from the previous step here)
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });
    try {
      let finalImageUrl = existingImageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        await supabase.storage.from("trek_images").upload(fileName, imageFile);
        const { data } = supabase.storage.from("trek_images").getPublicUrl(fileName);
        finalImageUrl = data.publicUrl;
      }
      const trekPayload = {
        title, description, start_date: startDate, amount: parseInt(amount), coordinator_details: coordinatorDetails,
        cover_image_url: finalImageUrl, difficulty_level: difficulty, duration, meeting_point: meetingPoint,
        meeting_time: meetingTime, transportation, meals_included: mealsIncluded, max_seats: parseInt(maxSeats), whatsapp_group_link: whatsappLink
      };
      if (editingId) {
        await supabase.from("treks").update(trekPayload).eq("id", editingId);
        setMessage({ text: "Trek updated successfully!", type: "success" });
      } else {
        await supabase.from("treks").insert([{ ...trekPayload, status: "UPCOMING" }]);
        setMessage({ text: "New trek published successfully!", type: "success" });
        handleResetForm();
      }
      await fetchTreksAndBookings();
    } catch (error) {
      setMessage({ text: "Operation failed.", type: "error" });
    } finally { setIsSubmitting(false); }
  };

  const openRoster = (trek: any) => {
    setActiveTrekForRoster(trek);
    setActiveTab("roster");
  };

  // --- OFFLINE BOOKING LOGIC ---
  const handleAddOfflinePassenger = () => setOfflinePassengers([...offlinePassengers, { name: "", age: "", gender: "Male" }]);
  const handleRemoveOfflinePassenger = (index: number) => setOfflinePassengers(offlinePassengers.filter((_, i) => i !== index));
  const handleOfflinePassengerChange = (index: number, field: string, value: string) => {
    const newPass = [...offlinePassengers];
    newPass[index] = { ...newPass[index], [field]: value };
    setOfflinePassengers(newPass);
  };

  const submitOfflineBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrekForRoster || offlinePassengers.length === 0 || !offlinePassengers[0].name) return;
    setIsSavingOffline(true);

    try {
      // 1. Create Confirmed Booking
      const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
        user_id: user.id, // Linked to admin who created it
        trek_id: activeTrekForRoster.id,
        utr_number: `OFFLINE_${offlinePaymentMode}_${offlineBookerPhone}`,
        booking_status: "CONFIRMED"
      }).select().single();

      if (bookingError) throw bookingError;

      // 2. Insert Passengers
      const passengersToInsert = offlinePassengers.map(p => ({
        booking_id: booking.id,
        full_name: p.name,
        age: parseInt(p.age) || 0,
        gender: p.gender,
        health_or_disability_notes: `Offline Booking by ${offlineBookerName}`
      }));

      const { error: passError } = await supabase.from("passengers").insert(passengersToInsert);
      if (passError) throw passError;

      alert("Offline booking added successfully!");
      setOfflineModalOpen(false);
      setOfflineBookerName(""); setOfflineBookerPhone(""); setOfflinePassengers([{ name: "", age: "", gender: "Male" }]);
      await fetchTreksAndBookings(); // Refresh data to update charts and tables
    } catch (error: any) {
      alert("Error adding offline booking: " + error.message);
    } finally {
      setIsSavingOffline(false);
    }
  };

  const copyRosterToClipboard = () => {
    const { confirmedBookings } = getSeatStats(activeTrekForRoster.id, activeTrekForRoster.max_seats);
    let text = `*Trek Roster: ${activeTrekForRoster.title}*\n*Date:* ${formatDate(activeTrekForRoster.start_date)}\n\n`;
    
    let count = 1;
    confirmedBookings.forEach(b => {
      const source = b.utr_number?.startsWith("OFFLINE") ? "(Offline)" : "(Online)";
      text += `*Booking:* ${b.profiles?.full_name || 'Cash Booking'} ${source}\n`;
      b.passengers?.forEach((p: any) => {
        text += `${count}. ${p.full_name} (${p.age}, ${p.gender.charAt(0)})\n`;
        count++;
      });
      text += `\n`;
    });
    
    navigator.clipboard.writeText(text);
    alert("Roster copied to clipboard! Ready to paste into WhatsApp.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Manager...</div>;
  const avatarLetter = profile?.full_name?.charAt(0).toUpperCase() || "A";

  return (
    <main className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Header (Same as before) */}
      <div className="bg-slate-900 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="h-24 w-24 bg-yellow-500 rounded-full flex items-center justify-center text-4xl font-black text-slate-900 border-4 border-slate-800 shadow-xl shrink-0">
            {avatarLetter}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Trek Catalog Manager</h1>
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Admin Zone</span>
            </div>
            <p className="text-gray-400">Manage expeditions, rosters, and offline collections.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col gap-2 lg:sticky lg:top-28">
              {TABS.filter(t => !t.hidden).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === "form" && !editingId) handleResetForm();
                    setActiveTab(tab.key);
                  }}
                  className={`text-left px-4 py-3 rounded-xl font-medium transition ${
                    activeTab === tab.key ? "bg-slate-50 text-slate-900 font-bold border-l-4 border-yellow-500" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {tab.key === "form" ? (editingId ? "Edit Trek" : "Add Trek") : tab.label}
                </button>
              ))}
              <Link href="/admin/bookings" className="text-left px-4 py-3 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition mt-2 border-t border-gray-100 pt-4">
                Verify Bookings ➔
              </Link>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* ---------------- MANAGE TREKS ---------------- */}
            {activeTab === "manage" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Manage Catalog</h2>
                
                {treks.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">No treks found.</div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {treks.map((t) => {
                      const { bookedCount, available, percentFilled } = getSeatStats(t.id, t.max_seats);
                      const isSoldOut = available <= 0;
                      const isFillingFast = percentFilled >= 75 && !isSoldOut;

                      return (
                        <div key={t.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row gap-5 transition hover:border-gray-300">
                          <div className="w-full sm:w-40 h-32 shrink-0 rounded-lg overflow-hidden bg-gray-200 relative">
                            {t.cover_image_url ? <img src={t.cover_image_url} alt={t.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
                            <div className="absolute top-2 left-2">
                              <span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wider ${STATUS_STYLES[t.status] || "bg-gray-100 text-gray-700"}`}>{t.status}</span>
                            </div>
                          </div>

                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              {/* --- UPDATED: Title and Top-Right Action Button --- */}
                              <div className="flex justify-between items-start mb-1 gap-4">
                                <h3 className="font-bold text-slate-900 text-lg leading-tight">{t.title}</h3>
                                <button 
                                  onClick={() => openRoster(t)} 
                                  className="shrink-0 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                  Control Room & Roster
                                </button>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">{formatDate(t.start_date)} · ₹{t.amount}</p>
                              
                              {/* Scarcity / Seat Progress Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between items-end mb-1">
                                  <span className="text-xs font-bold text-slate-700">{bookedCount} / {t.max_seats} Seats</span>
                                  {isSoldOut ? (
                                    <span className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded">Sold Out</span>
                                  ) : isFillingFast ? (
                                    <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1">
                                      🔥 Filling Fast ({available} left)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">{available} left</span>
                                  )}
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-1.5 rounded-full ${isSoldOut ? 'bg-red-500' : isFillingFast ? 'bg-orange-500' : 'bg-green-500'}`} 
                                    style={{ width: `${Math.min(percentFilled, 100)}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* --- UPDATED: Bottom Action Buttons --- */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-gray-100">
                              {t.status === "UPCOMING" ? (
                                <>
                                  {new Date(t.start_date) >= new Date(new Date().setHours(0,0,0,0)) ? (
                                    <>
                                      <button onClick={() => handleEditTrek(t)} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition">
                                        Edit Details
                                      </button>
                                      <button 
                                        onClick={() => handleCancelTrek(t.id)} 
                                        className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition"
                                      >
                                        Cancel Trek
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">Past Due: Requires Completion</span>
                                  )}
                                  
                                  <button 
                                    onClick={() => setCompletionModal({ isOpen: true, trekId: t.id, trekTitle: t.title })} 
                                    className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition"
                                  >
                                    Mark Completed
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                  Trek is {t.status} — Editing Disabled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- TREK CONTROL ROOM & ROSTER ---------------- */}
            {activeTab === "roster" && activeTrekForRoster && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setActiveTab("manage")} className="p-2 hover:bg-gray-100 rounded-full transition">
                    ←
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{activeTrekForRoster.title}</h2>
                    <p className="text-sm text-gray-500">{formatDate(activeTrekForRoster.start_date)}</p>
                  </div>
                </div>

                {/* Financial & Capacity Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {(() => {
                    const { bookedCount, available, onlineRevenue, offlineRevenue } = getSeatStats(activeTrekForRoster.id, activeTrekForRoster.max_seats);
                    return (
                      <>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                          <p className="text-2xl font-black text-blue-700">{bookedCount}</p>
                          <p className="text-xs font-bold text-blue-600 uppercase">Booked</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                          <p className="text-2xl font-black text-green-700">{available}</p>
                          <p className="text-xs font-bold text-green-600 uppercase">Available</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                          <p className="text-xl font-black text-slate-800">₹{onlineRevenue}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase">Online (Bank)</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                          <p className="text-xl font-black text-yellow-800">₹{offlineRevenue}</p>
                          <p className="text-xs font-bold text-yellow-700 uppercase">Offline (Cash/UPI)</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button onClick={() => setOfflineModalOpen(true)} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl transition shadow-sm">
                    + Add Offline Booking (Cash)
                  </button>
                  <button onClick={copyRosterToClipboard} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                    Copy List for WhatsApp
                  </button>
                </div>

                {/* The Roster Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Booked By</th>
                        <th className="p-4">Trekkers</th>
                        <th className="p-4">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {getSeatStats(activeTrekForRoster.id, activeTrekForRoster.max_seats).confirmedBookings.length === 0 ? (
                        <tr><td colSpan={3} className="p-8 text-center text-gray-500">No confirmed bookings yet.</td></tr>
                      ) : (
                        getSeatStats(activeTrekForRoster.id, activeTrekForRoster.max_seats).confirmedBookings.map((b) => {
                          const isOffline = b.utr_number?.startsWith("OFFLINE");
                          return (
                            <tr key={b.id} className="hover:bg-gray-50 transition">
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{isOffline ? "Offline Booker" : b.profiles?.full_name}</p>
                                <p className="text-xs text-gray-500">{isOffline ? b.utr_number.split('_').pop() : b.profiles?.mobile_number}</p>
                              </td>
                              <td className="p-4">
                                <ul className="list-disc list-inside text-gray-700">
                                  {b.passengers?.map((p: any, i: number) => (
                                    <li key={i}>{p.full_name} <span className="text-gray-400">({p.age}, {p.gender.charAt(0)})</span></li>
                                  ))}
                                </ul>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${isOffline ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {isOffline ? 'Offline' : 'Website'}
                                </span>
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

            {/* ---------------- ADD / EDIT FORM ---------------- */}
            {activeTab === "form" && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                {/* Your exact form code remains here... I've omitted the HTML form fields to save space, but you paste your <form onSubmit={handleSubmit}> block here exactly as it was! */}
                 <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingId ? "Edit Trek" : "Publish New Trek"}
                  </h2>
                  {editingId && (
                    <button onClick={handleResetForm} className="text-sm text-red-500 font-bold hover:underline">
                      Cancel Edit
                    </button>
                  )}
                </div>

                {message.text && (
                  <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Trek Title</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="e.g., Garbett Plateau" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                      <input type="date" required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description & Itinerary</label>
                    <textarea required rows={4} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Schedule, trail history, and packing list..." value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  {/* Logistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty</label>
                      <select className="w-full border border-gray-300 p-3 rounded-lg bg-white" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Hard">Hard</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Duration</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg" placeholder="2 Days / 1 Night" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Max Seats</label>
                      <input type="number" required className="w-full border border-gray-300 p-3 rounded-lg" value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} />
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Point</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg" placeholder="Dadar TT Circle" value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Time</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg" placeholder="10:30 PM (Friday)" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Transportation</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg" placeholder="Private Bus" value={transportation} onChange={(e) => setTransportation(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Meals Included</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg" placeholder="Breakfast, Lunch..." value={mealsIncluded} onChange={(e) => setMealsIncluded(e.target.value)} />
                    </div>
                  </div>

                  {/* Financials & Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
                      <input type="number" required className="w-full border border-gray-300 p-3 rounded-lg" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Coordinator Details</label>
                      <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg" placeholder="Rahul - 9876543210" value={coordinatorDetails} onChange={(e) => setCoordinatorDetails(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Group Link</label>
                      <input 
                        type="url" 
                        className="w-full border border-gray-300 p-3 rounded-lg" 
                        placeholder="https://chat.whatsapp.com/..." 
                        value={whatsappLink} 
                        onChange={(e) => setWhatsappLink(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image / Banner</label>
                    {existingImageUrl && !imageFile && (
                      <div className="mb-3 text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-10 h-10 rounded overflow-hidden"><img src={existingImageUrl} className="w-full h-full object-cover" alt="Existing Cover"/></span>
                        Current image preserved. Upload a new one below to replace it.
                      </div>
                    )}
                    <input type="file" accept="image/*" className="w-full text-sm bg-white border border-gray-200 p-2 rounded" onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0]);
                    }} />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50">
                    {isSubmitting ? "Processing..." : (editingId ? "Update Trek Details" : "Publish Trek to Catalog")}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- OFFLINE BOOKING MODAL --- */}
      {offlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-slate-50 sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-900">Record Offline Booking</h3>
              <p className="text-sm text-gray-500 mt-1">For <span className="font-bold text-slate-700">{activeTrekForRoster?.title}</span></p>
            </div>
            
            <form onSubmit={submitOfflineBooking} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Booker Name</label>
                  <input required type="text" className="w-full border p-3 rounded-xl outline-none" value={offlineBookerName} onChange={e => setOfflineBookerName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Booker Phone</label>
                  <input required type="tel" className="w-full border p-3 rounded-xl outline-none" value={offlineBookerPhone} onChange={e => setOfflineBookerPhone(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                <select className="w-full border p-3 rounded-xl outline-none bg-white" value={offlinePaymentMode} onChange={e => setOfflinePaymentMode(e.target.value)}>
                  <option value="CASH">Cash (Collected on ground)</option>
                  <option value="DIRECT_UPI">Direct UPI (To Coordinator)</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-900">Passenger Details</h4>
                  <button type="button" onClick={handleAddOfflinePassenger} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg">+ Add Person</button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {offlinePassengers.map((p, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <input required type="text" placeholder="Name" className="flex-grow border p-2 rounded-lg text-sm" value={p.name} onChange={e => handleOfflinePassengerChange(index, "name", e.target.value)} />
                      <input required type="number" placeholder="Age" className="w-16 border p-2 rounded-lg text-sm" value={p.age} onChange={e => handleOfflinePassengerChange(index, "age", e.target.value)} />
                      <select className="w-24 border p-2 rounded-lg text-sm bg-white" value={p.gender} onChange={e => handleOfflinePassengerChange(index, "gender", e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {offlinePassengers.length > 1 && (
                        <button type="button" onClick={() => handleRemoveOfflinePassenger(index)} className="text-red-500 font-bold px-2 hover:bg-red-50 rounded">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setOfflineModalOpen(false)} className="flex-1 bg-gray-100 text-slate-700 font-bold py-3 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={isSavingOffline} className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-xl transition disabled:opacity-50">
                  {isSavingOffline ? "Saving..." : `Confirm ₹${activeTrekForRoster?.amount * offlinePassengers.length}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPLETION & GALLERY UPLOAD MODAL --- */}
      {completionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-slate-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">Complete Expedition</h3>
              <p className="text-sm text-gray-500 mt-1">Upload memories for <span className="font-bold text-slate-700">{completionModal.trekTitle}</span></p>
            </div>
            
            <form onSubmit={submitTrekCompletion} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Post-Trek Notes / Memories (Optional)</label>
                <textarea 
                  rows={3}
                  className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="How was the weather? Any fun moments? (This will be appended to the trek description)"
                  value={completionNotes} 
                  onChange={e => setCompletionNotes(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Gallery Photos</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="w-full text-sm bg-gray-50 border border-gray-200 p-3 rounded-xl" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setGalleryFiles(Array.from(e.target.files));
                    }
                  }} 
                />
                <p className="text-xs text-gray-500 mt-2">
                  {galleryFiles.length > 0 ? `${galleryFiles.length} files selected for upload.` : "Select multiple photos to show on the Wall of Fame."}
                </p>
              </div>

              <div className="flex gap-3 mt-2 border-t border-gray-100 pt-5">
                <button 
                  type="button" 
                  onClick={() => {
                    setCompletionModal({ isOpen: false, trekId: "", trekTitle: "" });
                    setGalleryFiles([]);
                    setCompletionNotes("");
                  }} 
                  className="flex-1 bg-gray-100 text-slate-700 font-bold py-3 rounded-xl transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCompleting || galleryFiles.length === 0} 
                  className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl transition hover:bg-green-700 disabled:opacity-50"
                >
                  {isCompleting ? "Uploading & Saving..." : "Mark Completed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}