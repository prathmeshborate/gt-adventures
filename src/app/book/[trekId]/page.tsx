"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PaymentWidget from "@/components/PaymentWidget"; // Importing our shiny new widget!

export default function BookTrekPage() {
  const router = useRouter();
  const params = useParams();
  const trekId = params.trekId as string;

  const [user, setUser] = useState<any>(null);
  const [trek, setTrek] = useState<any>(null);
  const [savedRoster, setSavedRoster] = useState<any[]>([]);
  
  // Booking State
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // 1. Fetch Trek Details
      const { data: trekData } = await supabase
        .from("treks")
        .select("*")
        .eq("id", trekId)
        .single();
      if (trekData) setTrek(trekData);

      // 2. Fetch User's Saved Roster
      const { data: rosterData } = await supabase
        .from("saved_passengers")
        .select("*")
        .eq("user_id", session.user.id);
      if (rosterData) setSavedRoster(rosterData);

      setLoading(false);
    };

    fetchBookingData();
  }, [trekId, router]);

  // Handle Checkbox Selection
  const togglePassenger = (id: string) => {
    if (selectedPassengerIds.includes(id)) {
      setSelectedPassengerIds(selectedPassengerIds.filter(pid => pid !== id));
    } else {
      setSelectedPassengerIds([...selectedPassengerIds, id]);
    }
  };

  const totalAmount = (trek?.amount || 0) * Math.max(selectedPassengerIds.length, 1);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPassengerIds.length === 0) {
      alert("Please select at least one trekker.");
      return;
    }
    if (!screenshot) {
      alert("Please upload your payment screenshot.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload the Screenshot to Supabase Storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment_proofs") // Make sure you created this bucket in Supabase!
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      // 2. Create the Booking Row (Status defaults to PENDING)
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          trek_id: trekId,
          utr_number: utrNumber,
          payment_screenshot_path: fileName,
          booking_status: "PENDING"
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 3. Insert the Selected Passengers linked to this new booking
      const passengersToInsert = savedRoster
        .filter(p => selectedPassengerIds.includes(p.id))
        .map(p => ({
          booking_id: booking.id,
          full_name: p.full_name,
          age: p.age,
          gender: p.gender,
          health_or_disability_notes: p.health_or_disability_notes
        }));

      const { error: passError } = await supabase
        .from("passengers") // This uses your original passengers table!
        .insert(passengersToInsert);

      if (passError) throw passError;

      // 4. Success! Redirect to Profile
      alert("Booking submitted successfully! Our team will verify your payment.");
      router.push("/profile");

    } catch (error: any) {
      console.error("Booking Error:", error.message);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading booking details...</div>;
  if (!trek) return <div className="min-h-screen flex items-center justify-center">Trek not found.</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-gray-400">Complete your booking for <span className="text-yellow-500 font-bold">{trek.title}</span></p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Passengers */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Who is going?</h2>
              
              {savedRoster.length === 0 ? (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-sm">
                  You don't have any saved trekkers. Please go to your <Link href="/profile" className="font-bold underline">Profile</Link> to add your roster first!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {savedRoster.map((p) => (
                    <label key={p.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition ${selectedPassengerIds.includes(p.id) ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                        checked={selectedPassengerIds.includes(p.id)}
                        onChange={() => togglePassenger(p.id)}
                      />
                      <div className="ml-4">
                        <p className="font-bold text-slate-900">{p.full_name} <span className="text-gray-500 text-sm font-normal">({p.age}, {p.gender})</span></p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Payment & Submit */}
          <div className="flex flex-col gap-6">
            
            {/* Embedded Payment Widget */}
            <PaymentWidget amount={totalAmount} />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Payment Verification</h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">12-Digit UTR / Transaction No.</label>
                  <input 
                    type="text" required placeholder="e.g. 312345678901"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black font-mono uppercase"
                    value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Upload Payment Screenshot</label>
                  <input 
                    type="file" required accept="image/*"
                    className="w-full border border-gray-300 p-2 bg-gray-50 rounded-lg text-sm"
                    onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
                  />
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-end">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Amount</p>
                    <p className="text-3xl font-black text-slate-900">₹{totalAmount}</p>
                  </div>
                  <button 
                    type="submit" disabled={isSubmitting || selectedPassengerIds.length === 0}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Submit Booking"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}