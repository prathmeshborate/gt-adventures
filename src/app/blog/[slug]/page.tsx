import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description")
    .eq("slug", slug)
    .single()

  if (!post) return { title: 'Post Not Found' }

  return {
    title: `${post.title} | GT Adventures`,
    description: post.meta_description,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!post) {
    notFound() 
  }

  return (
    <main className="min-h-screen bg-white">
      
      {/* Post Header / Hero */}
      <section className="relative h-[45vh] min-h-[320px] sm:h-[60vh] sm:min-h-[400px] w-full bg-slate-900 flex items-end pb-10 sm:pb-20">
        {post.cover_image_url && (
          <div className="absolute inset-0 z-0">
            <img 
              src={post.cover_image_url} 
              alt={post.title} 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
        
        <div className="relative z-20 max-w-4xl mx-auto px-4 w-full text-center">
          <Link href="/blog" className="text-yellow-500 font-bold hover:text-yellow-400 mb-6 inline-block text-sm tracking-wide uppercase">
            ← Back to Articles
          </Link>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm font-bold text-gray-300">
            <span>By {post.author}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* The Article Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        <article className="prose prose-lg prose-slate max-w-none 
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-4
          prose-h3:text-2xl prose-h3:mt-8
          prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6
          prose-a:text-yellow-600 prose-a:font-bold prose-a:no-underline hover:prose-a:text-yellow-700 hover:prose-a:underline
          prose-ul:list-disc prose-ul:ml-6 prose-ul:text-gray-600 prose-ul:mb-6
          prose-li:mb-2
          prose-img:rounded-2xl prose-img:shadow-lg prose-img:w-full prose-img:my-10
        ">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Bottom Call to Action */}
        <div className="mt-20 pt-10 border-t border-gray-200 text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-4">Ready to start your adventure?</h3>
          <p className="text-gray-500 mb-8">Join hundreds of trekkers who have explored the Sahyadris safely with GT Adventures.</p>
          <Link href="/upcoming-treks" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition shadow-lg">
            View Upcoming Treks
          </Link>
        </div>

      </section>
    </main>
  )
}