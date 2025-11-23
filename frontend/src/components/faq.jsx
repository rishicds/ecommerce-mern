import React, { useState } from "react";

const faqData = [
  {
    id: "1",
    category: "Introduction",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "2",
    category: "Introduction",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "3",
    category: "Introduction",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "4",
    category: "Shipping & Delivery",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "5",
    category: "Shipping & Delivery",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "6",
    category: "Shipping & Delivery",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "7",
    category: "Quality & Regulations",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
  {
    id: "8",
    category: "Quality & Regulations",
    question: "lorem ipsum dolor sit amet consectetur.?",
    answer: "lorem ipsum dolor sit.",
  },
];

const FAQ = ({
  title = "FAQ",
  faqItems = faqData,
  imageSrc = "/pic2.jpg",
  imageAlt = "FAQ Image",
}) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Group items by category
  const groupedByCategory = faqItems.reduce((acc, item) => {
    const category = item.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <section className="w-full bg-white py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="mb-16 text-center">
          <span className="inline-block text-[#FFB81C] text-xs font-semibold uppercase tracking-widest mb-3">
            Questions & Answers
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base font-light">
            Find answers to commonly asked questions about our products and services
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - FAQ Items */}
          <div className="space-y-10">
            {Object.entries(groupedByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-lg font-medium text-gray-900 mb-5 uppercase tracking-wide opacity-60">
                  {category}
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 overflow-hidden transition-all duration-300 hover:border-gray-300"
                    >
                      {/* Question Header */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        aria-expanded={expandedId === item.id}
                        className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left cursor-pointer"
                      >
                        <span className="font-light text-gray-900 text-sm md:text-base pr-4">
                          {item.question}
                        </span>
                        <div
                          className={`shrink-0 w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                            expandedId === item.id
                              ? "bg-[#FFB81C] text-gray-900"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform duration-300 ${
                              expandedId === item.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d={expandedId === item.id ? "M18 12H6" : "M12 6v12m6-6H6"}
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Answer - Collapsible */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          expandedId === item.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="p-5 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-600 leading-relaxed text-sm font-light">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Image */}
          <div className="flex items-start justify-center lg:sticky lg:top-24 lg:self-start">
            <div className="w-full bg-gray-100 overflow-hidden shadow-sm">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/600x600?text=FAQ+Image";
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center border-t border-gray-200 pt-12">
          <h3 className="text-xl font-light text-gray-900 mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-500 text-sm font-light mb-6">
            Can't find the answer you're looking for? Please get in touch with our team.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center bg-gray-900 text-white hover:bg-[#FFB81C] hover:text-gray-900 font-light py-3.5 px-8 transition-all duration-300 text-sm tracking-wide"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;