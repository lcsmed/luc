import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            New Post
          </Link>
          <Link
            href="/"
            className="border border-gray-300 dark:border-gray-700 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            View Blog
          </Link>
        </div>
      </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Your Posts</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No posts yet. Create your first post!
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {post.published ? 'Published' : 'Draft'} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/admin/edit/${post.id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  )
}