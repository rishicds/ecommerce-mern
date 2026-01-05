import React from "react";

const sections = [
  {
    id: "information",
    title: "SECTION 1 — INFORMATION WE COLLECT",
    content: (
      <>
        <p className="mb-3">When you purchase from our store, we collect personal information necessary to complete your transaction, including:</p>
        <ul className="list-disc ml-6 mb-3">
          <li>Name</li>
          <li>Billing and shipping address</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Payment details (processed securely by third-party providers)</li>
        </ul>
        <p className="mb-2">When you browse our website, we automatically receive your IP address, browser type, and operating system to help us understand how visitors use our site.</p>
        <p>Email marketing (optional): With your consent, we may send emails about new products, promotions, or updates. You may unsubscribe at any time.</p>
      </>
    ),
  },
  {
    id: "consent",
    title: "SECTION 2 — CONSENT",
    content: (
      <>
        <p className="mb-2">How do you get my consent? When you provide personal information to complete a transaction, verify payment, place an order, or request support, you consent to our collection and use of that information for those purposes only. If we request personal information for secondary purposes, such as marketing, we will ask for your express consent or provide an option to decline.</p>
        <p>How do I withdraw my consent? You may withdraw your consent at any time by contacting us: <strong>knightstvapeshop@gmail.com</strong> | <strong>604-559-7833</strong> | Mailing Address: Knight St. Vape Shop, 1365 East 41st Avenue, Vancouver, BC, Canada</p>
      </>
    ),
  },
  {
    id: "disclosure",
    title: "SECTION 3 — DISCLOSURE",
    content: <p>We may disclose your personal information if required by law, regulation, or legal process, or if you violate our Terms of Service.</p>,
  },
  {
    id: "platform",
    title: "SECTION 4 — HOSTING & E-COMMERCE PLATFORM",
    content: (
      <>
        <p className="mb-2">Our website and services are hosted on DigitalOcean, which provides cloud infrastructure used to run and manage our application and databases.</p>
        <p className="mb-2">Your data is stored through DigitalOcean’s secure servers, databases, and storage systems, and is protected using industry-standard security measures, including firewalls and access controls.</p>
        <p>Payment Processing: Payment transactions are processed through secure third-party payment gateways. Payment information is encrypted and handled in compliance with applicable security standards (such as PCI-DSS). We do not store your full credit or debit card details on our servers.</p>
      </>
    ),
  },
  {
    id: "thirdparty",
    title: "SECTION 5 — THIRD-PARTY SERVICES",
    content: <p>Third-party providers (such as payment processors and shipping companies) only collect, use, and disclose your information to the extent necessary to perform their services. These providers may be located outside Canada; your information may therefore be subject to the laws of other jurisdictions. Once you leave our website or are redirected to a third-party site, you are no longer governed by this Privacy Policy.</p>,
  },
  {
    id: "analytics",
    title: "SECTION 6 — ANALYTICS & COOKIES",
    content: <p>We may use tools such as Google Analytics to understand how visitors use our website and to improve functionality and user experience. Cookies may be used to store preferences, session data, and analytics information.</p>,
  },
  {
    id: "security",
    title: "SECTION 7 — SECURITY",
    content: <p>We take reasonable precautions and follow industry best practices to protect your personal information from loss, misuse, unauthorized access, disclosure, alteration, or destruction. Sensitive data is encrypted using SSL technology, and we comply with applicable security standards.</p>,
  },
  {
    id: "age",
    title: "SECTION 8 — AGE RESTRICTION",
    content: <p>By using this website, you confirm that you are of legal age to purchase vaping products in your province or territory. We do not knowingly collect personal information from individuals under the legal age.</p>,
  },
  {
    id: "changes",
    title: "SECTION 9 — CHANGES TO THIS PRIVACY POLICY",
    content: <p>We reserve the right to modify this Privacy Policy at any time. Changes take effect immediately upon posting on the website. If our business is acquired or merged with another company, your information may be transferred to the new owners so that we may continue to serve you.</p>,
  },
];

const PrivacyPolicy = () => {
  return (
    <main className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-center text-gray-900 mb-6">Privacy Policy</h1>
       

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar TOC */}
          <aside className="hidden md:block md:col-span-1 sticky top-28 self-start">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">On this page</h4>
              <nav>
                <ul className="space-y-2 text-sm">
                  {sections.map((s, idx) => (
                    <li key={s.id}>
                      <button
                        onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="text-left w-full text-gray-600 hover:text-[#FFB81C] transition-colors"
                      >
                        <span className="inline-block w-6 mr-2 text-right text-xs text-gray-400">{idx + 1}.</span>
                        {s.title.replace(/SECTION \d+ — /, "")}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-700 text-sm">Knight St. Vape Shop (“we”, “us”, or “our”) respects your privacy and is committed to protecting your personal information. This Privacy Policy describes how we collect, use, and protect your information when you visit or make a purchase from our website.</p>
            </div>

            {sections.map((s, idx) => (
              <section id={s.id} key={s.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-md bg-[#FFB81C] flex items-center justify-center text-white font-semibold">{idx + 1}</div>
                  <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed">{s.content}</div>
              </section>
            ))}

            <div className="flex justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-[#FFB81C] hover:text-gray-900 transition-all"
              >
                Back to top
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
