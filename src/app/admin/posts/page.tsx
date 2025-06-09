import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function PostsPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect("/login")
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Link
          href="/admin/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Post
        </Link>
      </div>

      <div className="bg-black dark:bg-black rounded-lg shadow border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800 dark:border-gray-800">
          <h2 className="text-xl font-semibold">All Posts</h2>
        </div>
        <div className="divide-y divide-gray-800 dark:divide-gray-800">
          {posts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first blog post.</p>
              <Link
                href="/admin/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create First Post
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">{post.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.published 
                          ? 'bg-green-900 text-green-300 border border-green-800' 
                          : 'bg-yellow-900 text-yellow-300 border border-yellow-800'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>Updated {new Date(post.updatedAt).toLocaleDateString()}</span>
                      {post.published && post.slug && (
                        <Link 
                          href={`/post/${post.slug}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View Live →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}