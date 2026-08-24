"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function HomePage() {
  const [upcomingTreks, setUpcomingTreks] = useState<any[]>([]);
  const [pastTreks, setPastTreks] = useState<any[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      // Fetch top 3 upcoming treks
      const { data: upcoming } = await supabase
        .from("treks")
        .select("*")
        .eq("status", "UPCOMING")
        .order("start_date", { ascending: true })
        .limit(3);

      // Fetch top 3 completed treks for the gallery preview
      const { data: past } = await supabase
        .from("treks")
        .select("*")
        .eq("status", "COMPLETED")
        .order("start_date", { ascending: false })
        .limit(3);

      // Fetch top 3 recent published blogs
      const { data: blogs } = await supabase
        .from("blog_posts")
        .select("title, slug, meta_description, cover_image_url")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (upcoming) setUpcomingTreks(upcoming);
      if (past) setPastTreks(past);
      if (blogs) setRecentBlogs(blogs); // Save blogs to state
      setLoading(false);
    };

    fetchHomepageData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-yellow-500" />
        <p className="text-sm font-bold text-gray-500">Loading Adventure...</p>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen overflow-x-hidden pb-16 sm:pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative bg-slate-900 text-white px-4 pt-20 pb-28 sm:px-6 sm:pt-28 sm:pb-32 lg:px-8 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-5 sm:mb-6 leading-[1.05] tracking-tight [text-wrap:balance]">
            Escape the City.<br />
            <span className="text-yellow-500">Conquer the Mountains.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 px-2 [text-wrap:balance]">
            Join premium, expertly guided trekking experiences across the most breathtaking trails. Your next great story starts here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Link href="#upcoming" className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3.5 sm:py-4 px-8 rounded-xl transition-all shadow-lg shadow-yellow-500/20 text-base sm:text-lg w-full sm:w-auto">
              Find Your Trek
            </Link>
            <Link href="#gallery" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-3.5 sm:py-4 px-8 rounded-xl transition-all border border-white/20 text-base sm:text-lg w-full sm:w-auto">
              View Past Summits
            </Link>
          </div>
        </div>
      </section>

      {/* 2. UPCOMING TREKS PREVIEW */}
      <section id="upcoming" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16 lg:-mt-20 relative z-20 scroll-mt-24">
        <div className="flex justify-between items-end gap-3 mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-white">Upcoming Expeditions</h2>
          <Link href="/upcoming-treks" className="text-yellow-500 font-bold hover:text-yellow-400 transition text-xs sm:text-sm whitespace-nowrap">
            View All ➔
          </Link>
        </div>

        {upcomingTreks.length === 0 ? (
          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm sm:text-base">
            We are scouting new trails! Check back soon for new treks.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {upcomingTreks.map((trek) => (
              <div key={trek.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow group flex flex-col">
                <div className="h-44 sm:h-48 bg-gray-200 relative overflow-hidden">
                  {trek.cover_image_url ? (
                    <img src={trek.cover_image_url} alt={trek.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-900 text-xs font-black px-2 py-1 rounded">
                    {trek.difficulty_level}
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-1">{formatDate(trek.start_date)}</p>
                  <h3 className="font-bold text-slate-900 text-lg sm:text-xl mb-2 line-clamp-1">{trek.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{trek.description}</p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Cost</p>
                      <p className="font-black text-slate-900 text-base sm:text-lg">₹{trek.amount}</p>
                    </div>
                    <Link href={`/trek/${trek.id}`} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2 px-4 rounded-lg transition whitespace-nowrap">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CORPORATE B2B HOOK */}
      <section className="relative py-16 sm:py-20 md:py-24 bg-slate-900 overflow-hidden border-y border-slate-800 mt-14 sm:mt-16">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs sm:text-sm mb-3 sm:mb-4 block">
              GT Adventures For Business
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-5 sm:mb-6 leading-tight [text-wrap:balance]">
              Take Your Team Out of the Boardroom
            </h2>
            <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10">
              Swap the office for a campfire. We organize premium corporate outings, outdoor leadership training, and seamless offsite logistics for teams of all sizes.
            </p>
            <Link href="/corporate" className="inline-block w-full sm:w-auto text-center bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-xl transition shadow-lg shadow-yellow-500/20">
              Request a Corporate Quote
            </Link>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US (Trust Builders) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20 md:mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🏆</div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Expert Leaders</h3>
            <p className="text-gray-500 text-sm">Certified mountaineers with certified first-aid training leading every batch.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤝</div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Community First</h3>
            <p className="text-gray-500 text-sm">Come solo, leave with lifelong friends. We focus on group bonding.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🛡️</div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Safe & Secure</h3>
            <p className="text-gray-500 text-sm">Strict safety protocols, quality equipment, and carefully scouted routes.</p>
          </div>
        </div>
      </section>

      {/* 4. PAST TREKS GALLERY PREVIEW */}
      <section id="gallery" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20 md:mt-24 scroll-mt-24">
        <div className="flex justify-between items-end gap-3 mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Wall of Fame</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Memories from our successful summits.</p>
          </div>
          <Link href="/past-treks" className="text-slate-900 font-bold hover:text-slate-600 transition text-xs sm:text-sm whitespace-nowrap">
            View Gallery ➔
          </Link>
        </div>

        {pastTreks.length === 0 ? (
          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm sm:text-base">
            The gallery is currently empty. Our first summit is coming soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {pastTreks.map((trek) => (
              <div key={trek.id} className="group relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900">
                {/* Fallback to cover image if gallery_images is empty */}
                <img
                  src={(trek.gallery_images && trek.gallery_images.length > 0) ? trek.gallery_images[0] : trek.cover_image_url}
                  alt={trek.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5">
                  <p className="text-yellow-400 font-bold text-[10px] sm:text-xs uppercase tracking-wide mb-1">
                    {formatDate(trek.start_date)}
                  </p>
                  <h3 className="font-bold text-white text-sm sm:text-xl leading-tight line-clamp-2">{trek.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BLOG AND RESOURCES HOOK */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50 mt-14 sm:mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-10 md:mb-12 gap-4 sm:gap-6">
            <div>
              <span className="text-yellow-600 font-bold uppercase tracking-wider text-xs sm:text-sm mb-2 block">
                Tips & Resources
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                The Explorer's Journal
              </h2>
            </div>
            <Link href="/blog" className="text-slate-900 font-bold hover:text-yellow-600 transition flex items-center gap-2 text-sm sm:text-base">
              View All Guides ➔
            </Link>
          </div>

          {/* DYNAMIC BLOG GRID */}
          {recentBlogs.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100 text-sm sm:text-base px-4">
              New trekking guides coming soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {recentBlogs.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.slug} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                  <div className="h-44 sm:h-48 w-full bg-slate-200 overflow-hidden relative">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="text-3xl font-black text-slate-700">GT</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 sm:mb-3 group-hover:text-yellow-600 transition line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {post.meta_description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>

    </main>
  );
}
