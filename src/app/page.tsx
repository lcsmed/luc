import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: {
      published: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-16">
          <h1 className="text-4xl font-bold mb-4">luc sam</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            My personal space for thoughts and ideas
          </p>
        </header>

        <main>
          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.id} className="border-b border-gray-200 dark:border-gray-800 pb-12 last:border-0">
                <Link href={`/post/${post.slug}`} className="block group">
                  <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  <time className="text-sm text-gray-500 dark:text-gray-500 mb-3 block">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
