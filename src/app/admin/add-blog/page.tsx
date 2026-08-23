"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddBlogPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    meta_description: "",
    content: "",
    cover_image_url: "",
    is_published: false
  })

  // Auto-generate a URL-friendly slug from the title
  const handleTitleChange = (e: any) => {
    const newTitle = e.target.value
    const autoSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
    
    setFormData({ ...formData, title: newTitle, slug: autoSlug })
  }

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from("blog_posts")
      .insert([formData])

    if (error) {
      alert("Failed to publish post")
      console.error(error)
    } else {
      alert("Blog post saved successfully!")
      router.push("/profile")
    }
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-slate-900 pt-20 pb-24 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/profile" className="text-yellow-500 text-sm font-bold hover:text-yellow-400 mb-2 inline-block">
            ← Back to Command Center
          </Link>
          <h1 className="text-3xl font-black">Content Editor</h1>
          <p className="text-gray-400 mt-1">Write and publish SEO-optimized blog posts</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Post Title</label>
              <input 
                type="text" name="title" required 
                value={formData.title} onChange={handleTitleChange} 
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" 
                placeholder="Top 5 Monsoon Treks near Mumbai" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">URL Slug</label>
              <input 
                type="text" name="slug" required 
                value={formData.slug} onChange={handleChange} 
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none bg-gray-50" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Meta Description (For Google SEO)</label>
              <textarea 
                name="meta_description" required rows={2} 
                value={formData.meta_description} onChange={handleChange} 
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none resize-none" 
                placeholder="A short, catchy summary for search engine results..." 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image URL</label>
              <input 
                type="url" name="cover_image_url" 
                value={formData.cover_image_url} onChange={handleChange} 
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" 
                placeholder="https://..." 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Content (Markdown Supported)</label>
              <textarea 
                name="content" required rows={15} 
                value={formData.content} onChange={handleChange} 
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-mono text-sm" 
                placeholder="Write your blog post here..." 
              />
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input 
                type="checkbox" id="is_published" name="is_published" 
                checked={formData.is_published} onChange={handleChange} 
                className="w-5 h-5 accent-yellow-500" 
              />
              <label htmlFor="is_published" className="font-bold text-slate-900 cursor-pointer">
                Publish immediately
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition disabled:opacity-50">
              {isSubmitting ? "Saving Post..." : "Save Blog Post"}
            </button>
            
          </form>
        </div>
      </div>
    </main>
  )
}