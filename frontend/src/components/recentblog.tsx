import React from 'react';

const BLOG_POSTS = [
  {
    id: 1,
    title: "Beginner's Guide to Pod Systems",
    excerpt: "Everything you need to know about getting started with pod systems.",
    date: "November 18, 2025",
    readTime: "6 min read",
    image: "/Triple.jpg",
    slug: "/blog/beginners-pod-system-guide",
  },
  {
    id: 2,
    title: "Geek Bar Pulse Review",
    excerpt: "An in-depth look at the features and performance of the new Geek Bar Pulse.",
    date: "October 31, 2025",
    readTime: "2 min read",
    image: "/Flavour.png",
    slug: "/blog/geek-bar-pulse-review",
  },
  {
    id: 3,
    title: "Winter Vaping 101",
    excerpt: "Essential tips for maintaining your vape device during cold weather.",
    date: "October 24, 2025",
    readTime: "2 min read",
    image: "/Bease.png",
    slug: "/blog/winter-vaping-101",
  },
  {
    id: 4,
    title: "Travel-Proof Vaping",
    excerpt: "A guide to traveling safely with your vaping equipment and liquids.",
    date: "October 17, 2025",
    readTime: "2 min read",
    image: "/Grape.jpg",
    slug: "/blog/travel-proof-vaping",
  },
];

const RecentBlogs = () => {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center mb-10 md:mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-center uppercase md:text-4xl text-black">
            Recent Blogs
          </h2>
          <div className="w-16 h-1 mt-4 bg-[#FFB81C]"></div>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BLOG_POSTS.map((post) => (
            <div
              key={post.id}
              className="flex flex-col h-full overflow-hidden border border-gray-200 bg-white group transition-shadow duration-300 hover:shadow-md"
            >
              {/* Blog Image */}
              <div className="relative w-full pt-[48%] overflow-hidden bg-gray-100">
                <img
                  src={post.image}
                  alt={post.title}
                  className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Blog+Image';
                  }}
                />
              </div>

              {/* Blog Content */}
              <div className="flex flex-col flex-1 p-4">
                <h3 className="mb-3 text-lg font-bold leading-tight text-gray-900 line-clamp-3">
                  {post.title}
                </h3>

                <p className="mb-4 text-xs text-gray-600 line-clamp-4 flex-1">
                  {post.excerpt}
                </p>

                {/* Meta Information */}
                <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
                  <span>{post.date}</span>
                  <span>|</span>
                  <span>{post.readTime}</span>
                </div>

                {/* Read More Button */}
                <a
                  href={post.slug}
                  className="inline-flex items-center justify-start self-start w-auto px-4 py-2 text-xs font-medium text-black bg-[#FFB81C] hover:bg-[#e6a815] transition-colors duration-200"
                >
                  Read more
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentBlogs;