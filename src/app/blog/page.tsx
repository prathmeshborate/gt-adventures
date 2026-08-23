import { supabase } from "@/lib/supabase"
import Link from "next/link"

// This tells Next.js to revalidate (refresh) this page every hour,
// which is great for SEO and performance on Vercel.
export const revalidate = 3600; 

export default async function BlogCatalog() {
  // Fetch only published posts, ordered by newest first
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("title, slug, meta_description, cover_image_url, created_at, author")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <section className="bg-slate-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <span className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-4 block">
            The Explorer's Journal
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Trekking Guides & Resources
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Expert advice, trail histories, and packing guides to help you conquer the Sahyadris.
          </p>
        </div>
      </section>

      {/* Grid of Posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {!posts || posts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-200 text-gray-500">
            No articles published yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.slug} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                
                {/* Cover Image */}
                <div className="relative h-56 w-full overflow-hidden bg-gray-200">
                  {post.cover_image_url ? (
                    <img 
                      src={post.cover_image_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-slate-900 rounded-full shadow-sm">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-black text-slate-900 mb-3 group-hover:text-yellow-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-grow">
                    {post.meta_description}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      By {post.author}
                    </span>
                    <span className="text-sm font-bold text-yellow-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Post →
                    </span>
                  </div>
                </div>
                
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}