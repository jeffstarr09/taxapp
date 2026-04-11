import Link from "next/link";
import type { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Pushup Training Blog — Form Guides & Workout Plans",
  description:
    "Free pushup training guides, form tips, and workout plans. Learn how to get stronger with bodyweight training only.",
  alternates: {
    canonical: "https://dropfit.app/blog",
  },
  openGraph: {
    title: "Pushup Training Blog — Form Guides & Workout Plans",
    description:
      "Free pushup training guides, form tips, and workout plans from DROP.",
    url: "https://dropfit.app/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <article className="max-w-3xl mx-auto px-5 py-10">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
          The DROP Blog
        </h1>
        <p className="text-gray-500 text-lg">
          Pushup form guides, training plans, and bodyweight fitness tips.
        </p>
      </header>

      <div className="space-y-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block p-5 border border-gray-100 rounded-2xl hover:border-[#e8450a] hover:shadow-sm transition group"
          >
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 group-hover:text-[#e8450a] transition">
              {post.title}
            </h2>
            <p className="text-gray-500 text-sm">{post.description}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
