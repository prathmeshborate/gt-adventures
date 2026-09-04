import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import BookingCTA from "@/components/BookingCTA";

export default async function TrekDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params before extracting the ID
  const resolvedParams = await params;
  const trekId = resolvedParams.id;

  // 1. Fetch the specific trek using the RPC to get capacity info
  const { data: trekList, error } = await supabase
    .rpc("get_public_treks")
    .eq("id", trekId);
    
  const trek = trekList?.[0];

  // If someone types a wrong ID, show a 404 page
  if (error || !trek) {
    notFound();
  }

  // Format the date nicely
  const formattedDate = new Date(trek.start_date).toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // Check past status for sticky bar display
  const isPast = new Date(trek.start_date) < new Date();
  const isUpcoming = trek.status === "UPCOMING" && !isPast;
  const isFull = trek.booked_seats >= trek.max_seats;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-28 lg:pb-20">
      
      {/* Header Image Section */}
      <div className="relative w-full h-[35vh] md:h-[50vh] bg-slate-900">
        {trek.cover_image_url ? (
          <img 
            src={trek.cover_image_url} 
            alt={trek.title} 
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No Image Available</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* Left Column: Details */}
          <div className="flex-grow bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-4 flex items-center gap-3">
              <span className="bg-yellow-100 text-yellow-800 text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {trek.difficulty_level}
              </span>
              {isFull && isUpcoming && (
                <span className="bg-red-100 text-red-800 text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Sold Out
                </span>
              )}
              {!isFull && isUpcoming && trek.booked_seats >= trek.max_seats * 0.8 && (
                <span className="bg-orange-100 text-orange-800 text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Filling Fast
                </span>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 md:mb-6 text-gray-900 leading-tight">
              {trek.title}
            </h1>
            
            <div className="grid grid-cols-2 gap-4 mb-8 border-y border-gray-100 py-6">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Duration</p>
                <p className="text-sm md:text-base font-bold text-gray-900">{trek.duration}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Capacity</p>
                <p className="text-sm md:text-base font-bold text-gray-900">{trek.max_seats} Seats</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Meals</p>
                <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-2">{trek.meals_included}</p>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-4">About this Trek</h2>
            <div className="prose prose-sm md:prose-base prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
              {trek.description}
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-4">Logistics</h2>
            <div className="bg-gray-50 rounded-xl p-5 md:p-6 border border-gray-200 flex flex-col gap-4 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-900 mb-1 sm:mb-0">Meeting Point:</span>
                <span className="text-gray-700 text-left sm:text-right">{trek.meeting_point}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-900 mb-1 sm:mb-0">Meeting Time:</span>
                <span className="text-gray-700 text-left sm:text-right">{trek.meeting_time}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-semibold text-gray-900 mb-1 sm:mb-0">Transportation:</span>
                <span className="text-gray-700 text-left sm:text-right">{trek.transportation}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg border border-gray-200 lg:sticky lg:top-28 mb-6 lg:mb-0">
              <p className="text-gray-500 font-medium mb-1 text-sm md:text-base">Starting from</p>
              <div className="flex items-end gap-2 mb-6">
                <h3 className="text-3xl md:text-4xl font-black text-gray-900">₹{trek.amount}</h3>
                <span className="text-gray-500 mb-1 text-sm">/ person</span>
              </div>
              
              <div className="space-y-4 mb-6 text-sm md:text-base">
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="font-bold text-slate-900">📅 Date:</span> 
                  {formattedDate}
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="font-bold text-slate-900">📞 Contact:</span> 
                  {trek.coordinator_details}
                </div>
              </div>


              {/* Dynamic Booking Button / Notify Me */}
              <BookingCTA trek={trek} />
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Mobile Booking Bar */}
      {isUpcoming && !isFull && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4 z-50 lg:hidden animate-slide-up shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-xs text-gray-500 font-medium">Starting from</p>
            <p className="text-xl font-black text-slate-900">₹{trek.amount}<span className="text-sm font-normal text-gray-500"> /person</span></p>
          </div>

          <BookingCTA trek={trek} isMobile={true} />
        </div>
      )}
    </main>
  );
}