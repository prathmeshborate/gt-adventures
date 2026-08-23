"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function CorporatePage() {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    team_size: "10 - 20 people",
    experience_type: "1-Day Corporate Outing",
    tentative_date: "",
    special_requirements: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" })

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: "", message: "" })

    // 1. Save to Supabase
    const { error } = await supabase
      .from("corporate_leads")
      .insert([formData])

    if (error) {
      setSubmitStatus({ 
        type: "error", 
        message: "Something went wrong. Please try again or call us directly." 
      })
    } else {
      // 2. TRIGGER THE TELEGRAM ALERT
      await fetch('/api/telegram-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // 3. Show Success Message
      setSubmitStatus({ 
        type: "success", 
        message: "Quote request received! Our team will contact you shortly." 
      })
      setFormData({
        company_name: "", contact_person: "", phone_number: "", email: "",
        team_size: "10 - 20 people", experience_type: "1-Day Corporate Outing",
        tentative_date: "", special_requirements: ""
      })
    }
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-slate-900 text-white pt-32 pb-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-4 block">
            GT Adventures For Business
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            Take Your Team Out of the Boardroom and Into the Wild
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Premium corporate outings, high-impact leadership training, and unforgettable team bonding experiences designed for modern companies.
          </p>
          <a href="#quote-form" className="inline-block bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-yellow-500/20 text-lg">
            Request a Custom Quote
          </a>
        </div>
      </section>

      {/* 2. THE TRUST BAR */}
      <div className="bg-white border-y border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-center">
          <div>
            <p className="text-3xl font-black text-slate-900">100%</p>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Safety Record</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-200" />
          <div>
            <p className="text-3xl font-black text-slate-900">End-to-End</p>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Event Management</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-200" />
          <div>
            <p className="text-3xl font-black text-slate-900">Certified</p>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Mountaineers & Guides</p>
          </div>
        </div>
      </div>

      {/* 3. CORPORATE OFFERINGS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Tailored Experiences for Your Team</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Whether you want to relax by a campfire or push your team to their physical limits, we handle the logistics from start to finish.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">🤝</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Team Outings & Bonding</h3>
            <p className="text-gray-600 leading-relaxed">Casual, fun, and relaxing getaways focused on disconnecting from screens and connecting with each other in nature.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center text-2xl mb-6">⚡</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Outdoor Leadership</h3>
            <p className="text-gray-600 leading-relaxed">High-intensity, challenge-based activities designed to build critical thinking, trust, and resilience for management teams.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6">⛺</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Corporate Camping</h3>
            <p className="text-gray-600 leading-relaxed">Overnight stays featuring live acoustic music, stargazing, and premium campfire networking away from the city noise.</p>
          </div>
        </div>
      </section>

      {/* 4. THE LEAD CAPTURE FORM */}
      <section id="quote-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          <div className="bg-slate-900 text-white p-10 md:w-2/5 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black mb-4">Let us build your next great offsite.</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Fill out the form with your tentative requirements. Our corporate event specialist will contact you within 24 hours with a customized proposal and pricing.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Direct Contact</p>
              <p className="text-lg font-medium">+91 81086 70904</p>
              <p className="text-yellow-500 text-sm mt-1">contact@gtadventures.com</p>
            </div>
          </div>

          <div className="p-10 md:w-3/5 bg-white">
            
            {submitStatus.message && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${
                submitStatus.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}>
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                  <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label>
                  <input type="text" name="contact_person" required value={formData.contact_person} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Your Name" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="+91" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Work Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="you@company.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estimated Team Size</label>
                  <select name="team_size" value={formData.team_size} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none bg-white">
                    <option value="10 - 20 people">10 - 20 people</option>
                    <option value="21 - 50 people">21 - 50 people</option>
                    <option value="50+ people">50+ people</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tentative Date / Month</label>
                  <input type="text" name="tentative_date" value={formData.tentative_date} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="e.g. Mid November" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type of Experience</label>
                <select name="experience_type" value={formData.experience_type} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none bg-white">
                  <option value="1-Day Corporate Outing">1-Day Corporate Outing (Relaxing)</option>
                  <option value="Overnight Corporate Camping">Overnight Corporate Camping</option>
                  <option value="Outdoor Leadership & Team Building">Outdoor Leadership (Intensive)</option>
                  <option value="Not Sure Yet - Let's Discuss">Not Sure Yet - Let's Discuss</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Special Requirements (Optional)</label>
                <textarea name="special_requirements" rows={3} value={formData.special_requirements} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none resize-none" placeholder="Any specific locations, food preferences, or transport needs?" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition mt-2 disabled:opacity-50">
                {isSubmitting ? "Sending Request..." : "Submit Quote Request"}
              </button>

            </form>
          </div>
        </div>
      </section>

    </main>
  )
}