import React from "react";

const LocationMap = () => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[#FFB81C] text-xs font-semibold uppercase tracking-widest mb-3">
            Visit Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            Vancouver Location
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base font-light">
            Stop by our store for expert advice and our full product range
          </p>
        </div>

        {/* Map and Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Map */}
          <div className="lg:col-span-2 relative h-[400px] md:h-[500px] bg-gray-50 overflow-hidden shadow-sm">
            <iframe
              title="Knight St. Vape - Vancouver location map"
              src="https://www.google.com/maps?q=1365+E+41st+Ave,+Vancouver,+BC+V5W+1R7&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Info Panel */}
          <div className="bg-gray-50 p-8 md:p-10 flex flex-col">
            <div className="space-y-8 flex-1">
              {/* Address */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-xs uppercase tracking-wider mb-2 opacity-60">
                      Address
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed font-light">
                      1365 E 41st Ave<br />
                      Vancouver, BC V5W 1R7<br />
                      Canada
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-xs uppercase tracking-wider mb-2 opacity-60">
                      Phone
                    </h3>
                    <a 
                      href="tel:+16045597833" 
                      className="text-gray-700 text-sm hover:text-[#FFB81C] transition-colors font-light"
                    >
                      +1 (604) 559-7833
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="w-full">
                    <h3 className="font-medium text-gray-900 text-xs uppercase tracking-wider mb-3 opacity-60">
                      Store Hours
                    </h3>
                    <div className="space-y-3 text-sm font-light">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monday - Saturday</span>
                        <span className="text-gray-900">9AM - 10PM</span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sunday</span>
                        <span className="text-gray-900">9AM - 9PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-8 mt-8 border-t border-gray-200">
              <a 
                href="https://www.google.com/maps/dir//1365+E+41st+Ave,+Vancouver,+BC+V5W+1R7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-gray-900 text-white hover:bg-[#FFB81C] hover:text-gray-900 font-light py-3.5 px-6 transition-all duration-300 text-sm tracking-wide group"
              >
                <svg className="w-4 h-4 mr-2.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Get Directions
              </a>
              <a 
                href="tel:+16045597833"
                className="flex items-center justify-center w-full border border-gray-300 text-gray-900 hover:border-[#FFB81C] hover:text-[#FFB81C] font-light py-3.5 px-6 transition-all duration-300 text-sm tracking-wide group"
              >
                <svg className="w-4 h-4 mr-2.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Store
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-white p-8 md:p-10 border-l-2 border-[#FFB81C]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-1">
                <svg className="w-6 h-6 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-base mb-1">Need Help Finding Us?</h4>
                <p className="text-gray-600 text-sm font-light leading-relaxed max-w-xl">
                  We're located on Knight Street, easily accessible with plenty of parking available.
                </p>
              </div>
            </div>
            <a 
              href="tel:+16045597833"
              className="bg-[#FFB81C] hover:bg-gray-900 text-gray-900 hover:text-white font-light py-3 px-8 text-sm tracking-wide transition-all duration-300 whitespace-nowrap"
            >
              Call for Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;