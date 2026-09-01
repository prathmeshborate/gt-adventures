"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const pathname = usePathname()

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Auto-close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // 3. IMPROVEMENT: Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset"; // Cleanup if component unmounts
    };
  }, [isOpen]);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-20">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center">
             <div className="relative h-10 w-10 sm:h-14 sm:w-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-yellow-500 transition-all duration-300">
                <img 
                  src="/gt-adventures.png" 
                  alt="GT Adventures Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-xl sm:text-2xl tracking-wider text-white ml-3">
                GT <span className="text-yellow-500">ADVENTURES</span>
              </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-bold text-gray-300">
              <Link href="/upcoming-treks" className="hover:text-yellow-500 transition">Upcoming Treks</Link>
              <Link href="/past-treks" className="hover:text-yellow-500 transition">Wall of Fame</Link>
              <Link href="/corporate" className="hover:text-yellow-500 transition text-yellow-100">Corporate / B2B</Link>
            </div>
            
            <div className="w-px h-6 bg-slate-700" />
            
            {session ? (
              <Link href="/profile" className="flex items-center gap-2 text-white font-bold hover:text-yellow-500 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                My Profile
              </Link>
            ) : (
              <Link href="/login" className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-5 py-2 rounded-lg font-bold transition shadow-sm">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isOpen}
              className="text-gray-300 hover:text-white focus:outline-none p-2"
            >
              {isOpen ? (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {/* IMPROVEMENT: Changed to fixed positioning, calculated height to sit exactly below the 5rem (80px) navbar */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 fixed left-0 right-0 top-14 h-[calc(100vh-3.5rem)] animate-slide-down shadow-2xl z-40 overflow-y-auto">
          <div className="px-4 pt-4 pb-12 flex flex-col gap-2">
            <Link href="/upcoming-treks" className="block px-4 py-4 rounded-xl text-base font-bold text-white hover:bg-slate-800">
              Upcoming Treks
            </Link>
            <Link href="/past-treks" className="block px-4 py-4 rounded-xl text-base font-bold text-white hover:bg-slate-800">
              Wall of Fame (Gallery)
            </Link>
            <Link href="/blog" className="block px-4 py-4 rounded-xl text-base font-bold text-white hover:bg-slate-800">
              Trekking Blog
            </Link>
            <Link href="/corporate" className="block px-4 py-4 rounded-xl text-base font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 mt-4 mb-4">
              Corporate / B2B Quotes
            </Link>
            
            <div className="border-t border-slate-800 my-4 pt-4" />

            {session ? (
              <Link href="/profile" className="block px-4 py-4 rounded-xl text-base font-bold text-slate-900 bg-white hover:bg-gray-100 text-center">
                Go to My Profile
              </Link>
            ) : (
              <Link href="/login" className="block px-4 py-4 rounded-xl text-base font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 text-center">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}