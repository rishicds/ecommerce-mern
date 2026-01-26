import React from "react";

const termsSections = [
  {
    id: "eligibility",
    title: "1. ELIGIBILITY & AGE RESTRICTION",
    content: (
      <>
        <p className="mb-2">This website sells vaping products that are restricted to adults only. By using this site, you confirm that:</p>
        <ul className="list-disc ml-6 mb-2">
          <li>You are of legal age to purchase vaping products in your province or territory of residence in Canada.</li>
          <li>You are legally permitted to purchase and possess vaping products.</li>
        </ul>
        <p>We reserve the right to verify age at any time and to cancel or refuse any order that does not meet legal requirements.</p>
      </>
    ),
  },
  {
    id: "general",
    title: "2. GENERAL CONDITIONS",
    content: <p>We reserve the right to refuse service to anyone for any reason at any time, including but not limited to suspected fraud, violation of laws, or misuse of our website. You agree not to use our products or services for any illegal or unauthorized purpose.</p>,
  },
  {
    id: "products",
    title: "3. PRODUCTS & AVAILABILITY",
    content: <p>All products are subject to availability and may be discontinued or modified at any time without notice. We make every effort to display product descriptions and images accurately; however, we do not guarantee that descriptions, colors, or specifications are error-free.</p>,
  },
  {
    id: "pricing",
    title: "4. PRICING & PAYMENTS",
    content: (
      <ul className="list-disc ml-6">
        <li>All prices are listed in Canadian Dollars (CAD) unless otherwise stated.</li>
        <li>Prices may change without notice.</li>
        <li>Payments are processed securely through third-party payment providers.</li>
        <li>We reserve the right to cancel any order due to pricing errors or suspected fraudulent activity.</li>
      </ul>
    ),
  },
  {
    id: "shipping",
    title: "5. SHIPPING & DELIVERY",
    content: <p>We ship within Canada only, subject to provincial and territorial regulations. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers, weather conditions, or regulatory inspections. Once an order has been shipped, responsibility for delivery transfers to the carrier.</p>,
  },
  {
    id: "returns",
    title: "6. RETURNS & REFUNDS",
    content: <p>Due to health, safety, and regulatory reasons, all vaping products—including e-liquids, disposables, pods, coils, and devices—are final sale. Defective or incorrect items must be reported within 48 hours of delivery with proof of purchase and clear photos. Replacement or store credit may be issued at our discretion.</p>,
  },
  {
    id: "account",
    title: "7. ACCURACY OF ACCOUNT INFORMATION",
    content: <p>You agree to provide current, complete, and accurate information for all purchases and account activity. Failure to do so may result in order delays or cancellation.</p>,
  },
  {
    id: "ip",
    title: "8. INTELLECTUAL PROPERTY",
    content: <p>All content on this website, including logos, text, graphics, images, and design, is the property of Knight St. Vape Shop and may not be copied, reproduced, or used without written permission.</p>,
  },
  {
    id: "thirdpartylinks",
    title: "9. THIRD-PARTY LINKS",
    content: <p>Our website may contain links to third-party websites. We are not responsible for the content, policies, or practices of any third-party sites. Accessing third-party links is at your own risk.</p>,
  },
  {
    id: "disclaimer",
    title: "10. DISCLAIMER OF WARRANTIES",
    content: <p>All products and services are provided “as is” and “as available” without warranties of any kind, either express or implied. We do not guarantee that our website will be uninterrupted, secure, or error-free.</p>,
  },
  {
    id: "liability",
    title: "11. LIMITATION OF LIABILITY",
    content: <p>To the fullest extent permitted by law, Knight St. Vape Shop shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of our website, purchase or use of our products, or delays or service interruptions.</p>,
  },
  {
    id: "indemnify",
    title: "12. INDEMNIFICATION",
    content: <p>You agree to indemnify and hold harmless Knight St. Vape Shop, its owners, employees, and affiliates from any claims or demands arising out of your violation of these Terms or applicable laws.</p>,
  },
  {
    id: "law",
    title: "13. GOVERNING LAW",
    content: <p>These Terms are governed by and interpreted in accordance with the laws of the Province of British Columbia and the laws of Canada.</p>,
  },
  {
    id: "changes",
    title: "14. CHANGES TO TERMS",
    content: <p>We reserve the right to update or replace any part of these Terms at any time. Changes take effect immediately upon posting to the website. Continued use of the website after changes constitutes acceptance of the updated Terms.</p>,
  },
  {
    id: "contact",
    title: "15. CONTACT INFORMATION",
    content: (
      <p>If you have any questions about these Terms of Service, please contact us: Knight St. Vape Shop — 1365 East 41st Avenue, Vancouver, BC | 604-559-7833 | knightstvapeshop@gmail.com</p>
    ),
  },
];

const TermsOfService = () => {
  return (
    <main className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-center text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-center text-sm text-gray-600 mb-8">Last Updated: [Add Date]</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="hidden md:block md:col-span-1 sticky top-28 self-start">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Sections</h4>
              <nav>
                <ul className="space-y-2 text-sm">
                  {termsSections.map((s, idx) => (
                    <li key={s.id}>
                      <button
                        onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="text-left w-full text-gray-600 hover:text-[#FFB81C] transition-colors"
                      >
                        <span className="inline-block w-6 mr-2 text-right text-xs text-gray-400">{idx + 1}.</span>
                        {s.title.replace(/^\d+\.\s*/, "")}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <div className="md:col-span-3 space-y-6">
            {termsSections.map((s, idx) => (
              <section id={s.id} key={s.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-md bg-[#FFB81C] flex items-center justify-center text-white font-semibold">{idx + 1}</div>
                  <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed">{s.content}</div>
              </section>
            ))}

            <div className="flex justify-center">
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-[#FFB81C] hover:text-gray-900 transition-all">Back to top</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TermsOfService;
