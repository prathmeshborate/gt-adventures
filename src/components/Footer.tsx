import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400 py-10 sm:py-16 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand & About */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-6">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-transparent">
                <img src="/gt-adventures.png" alt="GT Adventures Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-xl tracking-wider text-white ml-3">
                GT <span className="text-yellow-500">ADVENTURES</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Premium corporate outings, high-impact leadership training, and unforgettable weekend treks in the Sahyadris
            </p>
            <p className="text-sm font-bold text-gray-300">contact@gtadventures.com</p>
            <p className="text-sm font-bold text-gray-300">+91 81086 70904</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-sm mb-6">Adventures</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/upcoming-treks" className="hover:text-yellow-500 transition">Upcoming Treks</Link></li>
              <li><Link href="/past-treks" className="hover:text-yellow-500 transition">Wall of Fame</Link></li>
              <li><Link href="/corporate" className="hover:text-yellow-500 transition">Corporate Team Outings</Link></li>
              <li><Link href="/corporate" className="hover:text-yellow-500 transition">Outdoor Leadership</Link></li>
            </ul>
          </div>

          {/* The SEO Mega-Menu / Community */}
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-sm mb-6">Resources</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/blog" className="hover:text-yellow-500 transition text-yellow-100">Trekking Guides & Blog</Link></li>
              <li><Link href="/blog/top-5-monsoon-treks-near-mumbai" className="hover:text-yellow-500 transition">Monsoon Treks Guide</Link></li>
              <li><Link href="/contact" className="hover:text-yellow-500 transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* Community Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-black uppercase tracking-wider text-sm mb-6">Join the Community</h3>
            <p className="text-sm mb-4">Get notified about early bird tickets and secret trails</p>
            <div className="flex flex-col sm:flex-row bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
              <input type="email" placeholder="Email address" className="bg-transparent w-full px-4 py-2 text-sm outline-none text-white" />
              <button className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-4 py-2 transition text-sm">
                Join
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-slate-900 mt-10 sm:mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} GT Adventures. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-white transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}