"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function UpcomingTreksPage() {
  const [treks, setTreks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTreks = async () => {
      const { data } = await supabase
        .rpc("get_public_treks")
        .eq("status", "UPCOMING")
        .gte("start_date", new Date().toISOString().split('T')[0])
        .order("start_date", { ascending: true });

      if (data) setTreks(data);
      setLoading(false);
    };

    fetchTreks();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-600 font-medium">Loading Expeditions...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header Section */}
      <div className="bg-slate-900 pt-20 pb-28 sm:pt-24 sm:pb-32 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Upcoming Expeditions</h1>
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
          Browse our calendar of upcoming treks, hikes, and backpacking trips. Secure your spot before they sell out!
        </p>
      </div>

      {/* Trek Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {treks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
            <p className="text-xl text-slate-900 font-bold mb-2">We are scouting new trails!</p>
            <p className="text-gray-500">Check back soon for our next batch of upcoming treks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {treks.map((trek) => (
              <div key={trek.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow group flex flex-col">
                
                {/* Image Cover */}
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  {trek.cover_image_url ? (
                    <img src={trek.cover_image_url} alt={trek.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <div className="bg-white/90 backdrop-blur text-slate-900 text-xs font-black px-2 py-1 rounded shadow-sm">
                      {trek.difficulty_level}
                    </div>
                    {trek.booked_seats >= trek.max_seats && (
                      <div className="bg-red-500/90 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest">
                        Sold Out
                      </div>
                    )}
                    {trek.booked_seats < trek.max_seats && trek.booked_seats >= trek.max_seats * 0.8 && (
                      <div className="bg-orange-500/90 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest">
                        Filling Fast
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-sm font-bold text-yellow-600 uppercase tracking-wide mb-2">{formatDate(trek.start_date)}</p>
                  <h3 className="font-bold text-slate-900 text-xl mb-3 line-clamp-2">{trek.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed">{trek.description}</p>
                  
                  {/* Footer/Action */}
                  <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Cost</p>
                      <p className="font-black text-slate-900 text-xl">₹{trek.amount}</p>
                    </div>
                    <Link href={`/trek/${trek.id}`} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-6 rounded-xl transition shadow-sm">
                      View Details
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}