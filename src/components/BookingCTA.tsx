"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BookingCTA({ trek, isMobile = false }: { trek: any, isMobile?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if trek date is passed
  const isPast = new Date(trek.start_date) < new Date();
  
  // Calculate availability based on the RPC response
  const isFull = trek.booked_seats >= trek.max_seats;
  const isUpcoming = trek.status === "UPCOMING" && !isPast;

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from("waitlist_notifications").insert({
      trek_id: trek.id,
      name,
      email,
      mobile
    });

    if (error) {
      alert("Error submitting request. Please try again.");
    } else {
      setNotified(true);
    }
    setLoading(false);
  };

  if (isMobile) {
    if (!isUpcoming || isFull) return null; // Don't show mobile sticky bar if past/full
    return (
      <Link
        href={`/book/${trek.id}`}
        className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all shadow-md text-sm whitespace-nowrap"
      >
        Book Now
      </Link>
    );
  }

  if (!isUpcoming) {
    return (
      <button 
        disabled
        className="block w-full text-center bg-gray-200 text-gray-500 font-bold text-base md:text-lg py-4 rounded-xl cursor-not-allowed"
      >
        {trek.status === "COMPLETED" || isPast ? "Trek Completed" : "Trek Cancelled"}
      </button>
    );
  }

  if (isFull) {
    if (notified) {
      return (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center">
          <p className="font-bold mb-1">You're on the list!</p>
          <p className="text-sm">We'll contact you if spots open up.</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
        <p className="text-red-600 font-bold text-center mb-3 text-sm">🔥 Sold Out! Join the Waitlist.</p>
        <form onSubmit={handleNotifySubmit} className="flex flex-col gap-3">
          <input 
            type="text" required placeholder="Your Name" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input 
            type="email" required placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input 
            type="tel" required placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <button 
            type="submit" disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Notify Me"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <Link 
        href={`/book/${trek.id}`}
        className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base md:text-lg py-4 rounded-xl transition-all shadow-md"
      >
        Book Your Spot Now
      </Link>
      <p className="text-center text-xs text-gray-400 mt-4">
        Secure payments via UPI QR Code.
      </p>
    </>
  );
}

