'use client'

import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import { Clock } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';

export default function Home() {
  const searchState = useSearchStore();

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => handleRecentSearchClick({ tripType: 'round-trip', from: 'NYC', to: 'LON', departureDate: '2026-10-15', returnDate: '2026-10-22', flexibility: 'exact' })}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold text-gray-900">NYC</div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="text-lg font-bold text-gray-900">LON</div>
                </div>
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md uppercase tracking-wider">Round-trip</span>
              </div>
              <div className="text-sm text-gray-500 mb-6 font-medium relative z-10">Oct 15 - Oct 22 • Exact dates</div>
              <div className="flex justify-between items-center group-hover:pt-2 transition-all relative z-10">
                <button className="text-sm text-blue-600 font-bold group-hover:text-blue-700 flex items-center">
                  Continue search
                  <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs">🌍</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleRecentSearchClick({ tripType: 'one-way', from: 'PAR', to: 'BER', departureDate: '2026-11-02', returnDate: null, flexibility: '±2' })}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold text-gray-900">PAR</div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="text-lg font-bold text-gray-900">BER</div>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md uppercase tracking-wider">One-way</span>
              </div>
              <div className="text-sm text-gray-500 mb-6 font-medium relative z-10">Nov 2 • ±2 Days</div>
              <div className="flex justify-between items-center group-hover:pt-2 transition-all relative z-10">
                <button className="text-sm text-blue-600 font-bold group-hover:text-blue-700 flex items-center">
                  Continue search
                  <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs">🌍</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
