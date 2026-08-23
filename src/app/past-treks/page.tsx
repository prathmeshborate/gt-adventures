"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PastTreksPage() {
  const [treks, setTreks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPastTreks = async () => {
      const { data } = await supabase
        .from("treks")
        .select("*")
        .eq("status", "COMPLETED")
        .order("start_date", { ascending: false }); // Newest completed treks first

      if (data) setTreks(data);
      setLoading(false);
    };

    fetchPastTreks();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-600 font-medium">Loading Gallery...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header Section */}
      <div className="bg-slate-900 pt-24 pb-32 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Wall of Fame</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Explore the memories, summits, and stories from our past expeditions. 
        </p>
      </div>

      {/* Gallery Feed */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {treks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
            <p className="text-xl text-slate-900 font-bold mb-2">No summits recorded yet.</p>
            <p className="text-gray-500">Our first completed trek will appear here soon!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {treks.map((trek) => {
              // Combine cover image with gallery images for a full visual grid, removing duplicates
              const allImages = Array.from(new Set([trek.cover_image_url, ...(trek.gallery_images || [])])).filter(Boolean);

              return (
                <div key={trek.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  {/* Trek Header Info */}
                  <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-black text-slate-900">{trek.title}</h2>
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                          Summit Reached
                        </span>
                      </div>
                      <p className="text-gray-500 font-medium">
                        {formatDate(trek.start_date)} · Led by {trek.coordinator_details?.split('-')[0] || "GT Adventures Team"}
                      </p>
                    </div>
                  </div>

                  {/* Trek Experience / Story */}
                  {trek.trek_experience && (
                    <div className="bg-slate-50 p-6 sm:p-8 border-b border-gray-100">
                      <p className="text-slate-700 leading-relaxed italic border-l-4 border-yellow-500 pl-4">
                        "{trek.trek_experience}"
                      </p>
                    </div>
                  )}

                  {/* Photo Grid */}
                  <div className="p-6 sm:p-8">
                    {allImages.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No photos uploaded for this trek.</p>
                    ) : (
                      <div className={`grid gap-4 ${
                        allImages.length === 1 ? "grid-cols-1" :
                        allImages.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
                        "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      }`}>
                        {allImages.map((imgUrl, index) => (
                          <div 
                            key={index} 
                            className={`rounded-xl overflow-hidden bg-gray-200 relative group ${
                              // Make the first image span 2 columns if there are many images for a cool masonry effect
                              index === 0 && allImages.length > 3 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                            }`}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`${trek.title} photo ${index + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" 
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}