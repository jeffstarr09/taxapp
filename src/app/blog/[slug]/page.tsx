import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, getAllBlogPosts } from "@/lib/blog-posts";

const SITE_URL = "https://dropfit.app";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      authors: ["DROP"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: "DROP",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "DROP",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-5 py-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-gray-400 text-sm mb-6 hover:text-[#e8450a] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          All Posts
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
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
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-gray-500 text-lg">{post.description}</p>
        </header>

        <div className="prose-drop">
          {post.content.map((section, i) => (
            <section key={i} className="mb-8">
              {section.heading && (
                <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4">
                  {section.heading}
                </h2>
              )}
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-gray-700 text-base leading-relaxed mb-4">
                  {p}
                </p>
              ))}
              {section.list &&
                (section.list.ordered ? (
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                    {section.list.items.map((item, k) => (
                      <li key={k} className="leading-relaxed">{item}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                    {section.list.items.map((item, k) => (
                      <li key={k} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                ))}
            </section>
          ))}
        </div>

        {/* In-article CTA */}
        <div className="mt-12 p-6 bg-[#e8450a]/5 border border-[#e8450a]/20 rounded-2xl text-center">
          <p className="text-gray-900 font-bold text-lg mb-2">
            Count every rep automatically
          </p>
          <p className="text-gray-500 text-sm mb-4">
            DROP uses AI to count your pushups and check your form in real time.
          </p>
          <Link
            href="/workout"
            className="inline-block px-6 py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm hover:bg-[#d03e09] transition"
          >
            Try It Free
          </Link>
        </div>
      </article>
    </>
  );
}
