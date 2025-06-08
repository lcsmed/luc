import { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Welcome to luc sam',
    slug: 'welcome-to-luc-sam',
    excerpt: 'This is my first post on luc sam, my personal space for sharing thoughts and ideas.',
    content: `Welcome to luc sam! This is my personal blog where I'll be sharing my thoughts on various topics that interest me.

I've always wanted a space where I can write freely about things that matter to me - from technology and coding to life experiences and random musings.

Why "luc sam"? It's a unique name that feels personal to me, and I wanted something that stands out from the typical blog names out there.

Stay tuned for more posts where I'll dive into topics like:
- Web development insights
- Personal growth experiences
- Book recommendations
- Random thoughts that keep me up at night

Thanks for visiting, and I hope you find something interesting here!`,
    date: '2025-01-06'
  },
  {
    id: '2',
    title: 'Building with Next.js',
    slug: 'building-with-nextjs',
    excerpt: 'My experience building this blog with Next.js and why I chose this framework.',
    content: `I decided to build luc sam using Next.js, and here's why this framework stood out to me.

Next.js offers the perfect balance of simplicity and power. With its App Router, I can create dynamic pages easily while maintaining great performance through server-side rendering.

Some features I particularly love:
- File-based routing makes organizing content intuitive
- Built-in TypeScript support for type safety
- Excellent developer experience with hot reloading
- Easy deployment options

The combination of React's component model with Next.js's conventions has made building this blog a smooth experience. I can focus on writing content and designing the user experience rather than worrying about configuration.

Looking forward to exploring more Next.js features as this blog grows!`,
    date: '2025-01-05'
  },
  {
    id: '3',
    title: 'Thoughts on Minimalism',
    slug: 'thoughts-on-minimalism',
    excerpt: 'Why I believe less is more, both in design and in life.',
    content: `Minimalism isn't just about having fewer things - it's about making room for what truly matters.

In design, minimalism helps users focus on the content without distractions. That's why I've kept luc sam's design clean and simple. No unnecessary animations, no cluttered sidebars, just the words and ideas I want to share.

This philosophy extends beyond design:
- In code: Write less, but make it count
- In life: Own fewer things, but cherish what you have
- In relationships: Fewer but deeper connections

The paradox is that by limiting our options, we often find more freedom. When everything is intentional, nothing is wasted.

This blog itself is an exercise in minimalism - a simple platform for sharing thoughts without the noise of social media or complex features. Just words, ideas, and the space to think.`,
    date: '2025-01-04'
  }
];

export function getAllPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}