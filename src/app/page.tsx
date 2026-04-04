'use client'

import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import { Clock } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';
import { useState, useEffect } from 'react';
import OnboardingGuide from '@/components/OnboardingGuide';

export default function Home() {
  const searchState = useSearchStore();

  const defaultIndiaRoutes = [
    { tripType: 'one-way', from: 'Delhi', to: 'Mumbai', departureDate: '2026-11-01', returnDate: null, flexibility: 'exact' },
    { tripType: 'round-trip', from: 'Bangalore', to: 'Hyderabad', departureDate: '2026-12-10', returnDate: '2026-12-15', flexibility: '±2' },
    { tripType: 'one-way', from: 'Chandigarh', to: 'Delhi', departureDate: '2026-10-20', returnDate: null, flexibility: 'exact' },
    { tripType: 'round-trip', from: 'Mumbai', to: 'Goa', departureDate: '2026-12-25', returnDate: '2027-01-05', flexibility: '±3' },
  ];

  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tripdone_recent_searches');
      if (stored) {
         const parsed = JSON.parse(stored);
         if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed.slice(0, 4));
         } else {
            setRecentSearches(defaultIndiaRoutes);
         }
      } else {
         setRecentSearches(defaultIndiaRoutes);
      }
    } catch {
       setRecentSearches(defaultIndiaRoutes);
    }
    setIsLoaded(true);
  }, []);

  const handleRecentSearchClick = (searchData: any) => {
    searchState.setSearch(searchData);
    document.getElementById('search-box')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50/30 selection:bg-blue-200">
      <Navbar />
      
      <main className="relative max-w-7xl mx-auto px-6 pt-8 pb-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-400/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="text-center space-y-4 mb-6 relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Plan the smartest way to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">travel</span> <br className="hidden md:block"/>
            across every mode.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Compare flights, trains, buses, and cabs — all in one seamless journey. Stop checking five different tabs.
          </p>
        </div>

        <div className="relative z-20" id="search-box">
          <SearchBox />
        </div>

        <div className="mt-16 max-w-5xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-400" />
              Recent Searches
            </h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all history</button>
          </div>
          
          <div id="tour-recent" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoaded && recentSearches.map((search, idx) => (
              <div 
                key={idx}
                onClick={() => handleRecentSearchClick(search)}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20 relative overflow-hidden flex flex-col w-full h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-bold text-gray-900 truncate max-w-[80px]" title={search.from}>{search.from || 'Origin'}</div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div className="text-lg font-bold text-gray-900 truncate max-w-[80px]" title={search.to}>{search.to || 'Dest'}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0 ml-2 ${search.tripType === 'one-way' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {search.tripType === 'round-trip' ? 'Round' : '1-Way'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-6 font-medium relative z-10 flex-grow">
                  {search.departureDate ? new Date(search.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Anytime'}
                  {search.returnDate ? ` - ${new Date(search.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''} • {search.flexibility === 'exact' ? 'Exact' : search.flexibility || 'exact'}
                </div>
                <div className="flex justify-between items-center group-hover:pt-2 transition-all relative z-10 mt-auto">
                  <button className="text-sm text-blue-600 font-bold group-hover:text-blue-700 flex items-center">
                    Search
                    <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">🇮🇳</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <OnboardingGuide />
    </div>
  );
}
