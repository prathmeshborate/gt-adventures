import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TrekDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params before extracting the ID
  const resolvedParams = await params;
  const trekId = resolvedParams.id;

  // 1. Fetch the specific trek using the ID from the URL
  const { data: trek, error } = await supabase
    .from("treks")
    .select("*")
    .eq("id", trekId)
    .single();

// ... the rest of your code remains exactly the same!

  // If someone types a wrong ID, show a 404 page
  if (error || !trek) {
    notFound();
  }

  // Format the date nicely
  const formattedDate = new Date(trek.start_date).toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      
      {/* Header Image Section */}
      <div className="relative w-full h-[50vh] bg-slate-900">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Details */}
          <div className="flex-grow bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-4">
              <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {trek.difficulty_level}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
              {trek.title}
            </h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 border-y border-gray-100 py-6">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Duration</p>
                <p className="font-bold text-gray-900">{trek.duration}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">Capacity</p>
                <p className="font-bold text-gray-900">{trek.max_seats} Seats</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 font-semibold">Meals</p>
                <p className="font-bold text-gray-900 line-clamp-1">{trek.meals_included}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">About this Trek</h2>
            <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
              {trek.description}
            </div>

            <h2 className="text-2xl font-bold mb-4">Logistics</h2>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-900">Meeting Point:</span>
                <span className="text-gray-700">{trek.meeting_point}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-900">Meeting Time:</span>
                <span className="text-gray-700">{trek.meeting_time}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-semibold text-gray-900">Transportation:</span>
                <span className="text-gray-700">{trek.transportation}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 sticky top-28">
              <p className="text-gray-500 font-medium mb-1">Starting from</p>
              <div className="flex items-end gap-2 mb-6">
                <h3 className="text-4xl font-black text-gray-900">₹{trek.amount}</h3>
                <span className="text-gray-500 mb-1">/ person</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="font-bold text-slate-900">📅 Date:</span> 
                  {formattedDate}
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="font-bold text-slate-900">📞 Contact:</span> 
                  {trek.coordinator_details}
                </div>
              </div>

              {/* Next step: This button will lead to our passenger booking form */}
              <Link 
                href={`/book/${trek.id}`}
                className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg py-4 rounded-xl transition-all shadow-md"
              >
                Book Your Spot Now
              </Link>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                Secure payments via UPI QR Code.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}