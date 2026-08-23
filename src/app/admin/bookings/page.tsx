"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const PAYMENT_BUCKET = "payment_proofs";

export default function AdminBookingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    const fetchAdminData = async () => {
  // 1. Verify User and Admin Role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    router.push("/login");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") {
    alert("Access Denied: You must be an admin to view this page.");
    router.push("/");
    return;
  }

  setIsAdmin(true);

  // 2. Fetch bookings (Temporarily removed 'profiles' to prevent join errors)
  // 2. Fetch bookings AND the user profiles
  const { data: bookingData, error } = await supabase
    .from("bookings")
    .select(`
      *,
      treks (title, amount, start_date),
      passengers (full_name, age, gender),
      profiles (full_name, mobile_number)
    `)
    .order("created_at", { ascending: false });

  // 3. LOG THE ERROR SO WE CAN SEE IT!
  if (error) {
    console.error("SUPABASE FETCH ERROR:", error.message, error.details);
    alert("Database Error: " + error.message); 
  } else {
    setBookings(bookingData || []);
  }
  
  setLoading(false);
};

    fetchAdminData();
  }, [router]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      // Update the UI instantly
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, booking_status: newStatus } : b));
    } catch (error: any) {
      alert("Failed to update status: " + error.message);
    }
  };

  const handleViewPaymentProof = async (path: string) => {
    const { data, error } = await supabase.storage.from(PAYMENT_BUCKET).createSignedUrl(path, 60);
    if (error || !data) {
      alert("Could not open the payment screenshot.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const filteredBookings = bookings.filter(b => b.booking_status === filter);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Verifying Admin Access...</div>;
  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Verifications</h1>
            <p className="text-gray-500">Review incoming payments and approve trekkers.</p>
          </div>
          <div className="flex gap-2">
            {["PENDING", "CONFIRMED", "CANCELLED"].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  filter === status ? "bg-slate-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status} ({bookings.filter(b => b.booking_status === status).length})
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No {filter.toLowerCase()} bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-sm text-gray-500">
                    <th className="p-4 font-semibold">Trek & Date</th>
                    <th className="p-4 font-semibold">Booked By</th>
                    <th className="p-4 font-semibold">Payment Details</th>
                    <th className="p-4 font-semibold">Passengers</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      
                      {/* Trek Info */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-900">{b.treks?.title}</p>
                        <p className="text-xs text-gray-500">{new Date(b.treks?.start_date).toLocaleDateString()}</p>
                      </td>

                      {/* User Info */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-900">{b.profiles?.full_name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{b.profiles?.mobile_number}</p>
                        <p className="text-xs text-gray-500">{b.profiles?.email}</p>
                      </td>

                      {/* Payment Info */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-900">₹{(b.treks?.amount || 0) * Math.max(b.passengers?.length || 1, 1)}</p>
                        <p className="text-xs font-mono text-gray-500 mb-2">UTR: {b.utr_number}</p>
                        {b.payment_screenshot_path && (
                          <button 
                            onClick={() => handleViewPaymentProof(b.payment_screenshot_path)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                          >
                            View Screenshot
                          </button>
                        )}
                      </td>

                      {/* Passengers */}
                      <td className="p-4 align-top">
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-bold mb-2">
                          {b.passengers?.length || 0} Trekkers
                        </span>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {b.passengers?.map((p: any, i: number) => (
                            <li key={i}>• {p.full_name} ({p.age})</li>
                          ))}
                        </ul>
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-top text-right">
                        {b.booking_status === "PENDING" ? (
                          <div className="flex flex-col gap-2 items-end">
                            <button 
                              onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold w-full max-w-[120px]"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold w-full max-w-[120px]"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            b.booking_status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {b.booking_status}
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}