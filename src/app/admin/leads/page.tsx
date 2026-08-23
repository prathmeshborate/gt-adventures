"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("NEW") // "NEW", "CONTACTED", "CLOSED"

  useEffect(() => {
    const fetchLeads = async () => {
      // 1. Verify Admin Status First
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profile?.role !== "admin") {
        router.push("/")
        return
      }

      // 2. Fetch the Leads
      const { data: leadsData } = await supabase
        .from("corporate_leads")
        .select("*")
        .order("created_at", { ascending: false })

      if (leadsData) {
        setLeads(leadsData)
      }
      setLoading(false)
    }

    fetchLeads()
  }, [router])

  const updateLeadStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("corporate_leads")
      .update({ status: newStatus })
      .eq("id", id)

    if (error) {
      alert("Failed to update status")
      return
    }

    // Update local state to reflect the change instantly
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead))
  }

  const filteredLeads = leads.filter(lead => lead.status === filter)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Dashboard...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Admin Header */}
      <div className="bg-slate-900 pt-20 pb-24 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/profile" className="text-yellow-500 text-sm font-bold hover:text-yellow-400 mb-2 inline-block">
              ← Back to Command Center
            </Link>
            <h1 className="text-3xl font-black">Corporate Leads</h1>
            <p className="text-gray-400 mt-1">Manage incoming B2B quote requests.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-800 p-4 rounded-xl text-center min-w-[100px]">
              <p className="text-2xl font-black text-white">{leads.filter(l => l.status === "NEW").length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase">New Leads</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center min-w-[100px]">
              <p className="text-2xl font-black text-white">{leads.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        
        {/* Status Filters */}
        <div className="flex gap-2 mb-6">
          {["NEW", "CONTACTED", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${
                filter === status
                  ? "bg-white text-slate-900 border-b-4 border-yellow-500"
                  : "bg-white text-gray-400 border-b-4 border-transparent hover:text-gray-600"
              }`}
            >
              {status}
              {status === "NEW" && leads.filter(l => l.status === "NEW").length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {leads.filter(l => l.status === "NEW").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lead Cards */}
        {filteredLeads.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500">
            No leads found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col">
                
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{lead.company_name}</h2>
                    <p className="text-sm font-bold text-gray-500">{lead.contact_person}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-4">
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Phone</p>
                    <a href={`tel:${lead.phone_number}`} className="font-medium text-slate-900 hover:text-yellow-600">
                      {lead.phone_number}
                    </a>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Email</p>
                    <a href={`mailto:${lead.email}`} className="font-medium text-slate-900 hover:text-yellow-600 line-clamp-1">
                      {lead.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Team Size</p>
                    <p className="font-medium text-slate-900">{lead.team_size}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Experience</p>
                    <p className="font-medium text-slate-900">{lead.experience_type}</p>
                  </div>
                </div>

                {lead.special_requirements && (
                  <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 mb-6">
                    <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">Notes</p>
                    <p className="text-sm text-slate-700 italic">"{lead.special_requirements}"</p>
                  </div>
                )}

                {/* Actions Grid */}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  {lead.status === "NEW" && (
                    <>
                      <button onClick={() => updateLeadStatus(lead.id, "CONTACTED")} className="bg-slate-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-slate-800 transition">
                        Mark Contacted
                      </button>
                      <button onClick={() => updateLeadStatus(lead.id, "CLOSED")} className="bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition">
                        Mark Closed
                      </button>
                    </>
                  )}
                  {lead.status === "CONTACTED" && (
                    <>
                      <a href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white text-center text-sm font-bold py-2.5 rounded-lg hover:bg-[#20bd5a] transition">
                        WhatsApp Them
                      </a>
                      <button onClick={() => updateLeadStatus(lead.id, "CLOSED")} className="bg-slate-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-slate-800 transition">
                        Close Deal
                      </button>
                    </>
                  )}
                  {lead.status === "CLOSED" && (
                    <button disabled className="col-span-2 bg-green-50 text-green-700 border border-green-200 text-sm font-bold py-2.5 rounded-lg cursor-default">
                      Deal Closed
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}