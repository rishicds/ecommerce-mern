import React, { useState, useEffect } from "react";

const AgeGate = ({ storageKey = "ageVerified", defaultMinAge = 19 }) => {
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const currentYear = new Date().getFullYear();
  // Default birth year set to Jan 1, 2025 per request
  const defaultYear = 2025;
  const [year, setYear] = useState(defaultYear);
  const minAge = defaultMinAge; // fixed minimum age (19 by default)
  const [visible, setVisible] = useState(false); 

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) setVisible(true);
    } catch (e) {
      setVisible(true);
    }
  }, [storageKey]);

  const calculateAge = (d, m, y) => {
    const today = new Date();
    const birth = new Date(y, m - 1, d);
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const onAgree = () => {
    const age = calculateAge(day, month, year);
    if (age >= Number(minAge)) {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ verified: true, at: Date.now(), minAge })); } catch (e) {}
      setVisible(false);
    } else {
      window.location.href = "https://www.google.com/";
    }
  };

  const onDisagree = () => {
    window.location.href = "https://www.google.com/";
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 sm:p-10 text-center shadow-2xl">
        <h2 className="text-2xl sm:text-4xl font-extrabold mb-2">Welcome!</h2>
        <p className="text-gray-600 text-sm sm:text-base mb-6">This site is intended for adults only. Verify that you meet the legal age requirement.</p>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
          <select aria-label="Day" value={day} onChange={(e) => setDay(Number(e.target.value))} className="border rounded-md px-3 py-2 sm:px-4 sm:py-2 shadow-sm appearance-none text-sm">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select aria-label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded-md px-3 py-2 sm:px-4 sm:py-2 shadow-sm appearance-none text-sm">
            {[
              "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
            ].map((mName, idx) => (
              <option key={idx} value={idx + 1}>{mName}</option>
            ))}
          </select>

          <select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-md px-3 py-2 sm:px-4 sm:py-2 shadow-sm appearance-none text-sm">
            {Array.from({ length: 100 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Minimum age is enforced internally (default 19) */}

        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={onAgree} className="bg-black text-white py-2 px-6 sm:py-3 sm:px-8 rounded-xl shadow-md text-sm sm:text-base">Agree</button>
          <button onClick={onDisagree} className="border-2 border-black text-black py-2 px-6 sm:py-3 sm:px-8 rounded-xl text-sm sm:text-base">Disagree</button>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;
