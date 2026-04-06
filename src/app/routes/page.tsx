'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Info, CheckCircle, ChevronDown, ChevronUp, Plane, Train, Car, Bus } from 'lucide-react'
import Navbar from '@/components/Navbar'

const parseDurationToMins = (durationStr: string) => {
  if (!durationStr) return 0;
  if (!isNaN(Number(durationStr))) return Number(durationStr);
  const hMatch = durationStr.match(/(\d+)h/i);
  const mMatch = durationStr.match(/(\d+)m/i);
  let mins = 0;
  if (hMatch) mins += parseInt(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[1]);
  return mins;
}

const getModeIcon = (mode: string, className: string = "w-4 h-4") => {
  switch (mode.toLowerCase()) {
    case 'flight': return <Plane className={className} />;
    case 'train': return <Train className={className} />;
    case 'bus': return <Bus className={className} />;
    case 'cab': 
    case 'taxi': return <Car className={className} />;
    default: return <Info className={className} />;
  }
}

export default function RoutesPage() {
  const searchState = useSearchStore()
  const router = useRouter()
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null)



  useEffect(() => {
    if (!searchState.from || !searchState.to) {
      router.replace('/');
    }
  }, [searchState.from, searchState.to, router]);

  const isLoading = false;
  const routes = searchState.routes || [];

  // Pre-calculate stats
  let cheapestIdx = -1;
  let fastestIdx = -1;
  let bestIdx = -1;

  if (routes.length > 0) {
    let minPrice = Infinity;
    let minTime = Infinity;
    let minScore = Infinity;

    routes.forEach((route: any, i: number) => {
      // Calculate derived price from legs if missing, and fallback safely
      const priceFromLegs = route.legs?.reduce((sum: number, leg: any) => sum + (leg.price || 0), 0) || 0;
      let p = priceFromLegs > 0 ? priceFromLegs : (route.totalPrice || route.price || 5000);
      if (p === 0) p = 5000;
      route._calcPrice = p;

      const t = parseDurationToMins(route.totalDuration || route.duration || '0h 0m');
      
      if (p < minPrice && p > 0) { minPrice = p; cheapestIdx = i; }
      if (t < minTime && t > 0) { minTime = t; fastestIdx = i; }
      
      const score = p * (t || 1);
      if (score < minScore && p > 0) { minScore = score; bestIdx = i; }
    });
  }

  // Ensure unique labels
  if (bestIdx === cheapestIdx) cheapestIdx = -1;
  if (bestIdx === fastestIdx) fastestIdx = -1;
  if (cheapestIdx === fastestIdx) fastestIdx = -1;

  const sortedRoutes = [...routes].map((r: any, i) => {
    let rawScore = (r._calcPrice || 5000) * (parseDurationToMins(r.totalDuration || r.duration || '0h') || 1);
    return { ...r, _originalIdx: i, _score: rawScore };
  }).sort((a, b) => a._score - b._score);

  const handleSelectRoute = (route: any) => {
    const modes = route.legs?.map((leg: any) => leg.mode?.toLowerCase() || '') || [];
    searchState.setSearch({ selectedRoute: route, selectedModes: modes });
    
    // Dynamic navigation
    if (modes.length > 0 && modes[0]) {
      router.push(`/${modes[0]}`);
    } else {
      router.push(`/flight`); // fallback
    }
  }

  const toggleExpand = (idx: number) => {
    setExpandedRoute(expandedRoute === idx ? null : idx);
  }

  return (
    <div className="min-h-screen bg-gray-50/30 selection:bg-blue-200 font-sans">
      <Navbar />
      
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-lg font-black text-gray-900">
                <span>{searchState.from || '---'}</span>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                <span>{searchState.to || '---'}</span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                {searchState.departureDate ? new Date(searchState.departureDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Any date'}
                {' '}• {searchState.tripType === 'round-trip' ? 'Round-trip' : 'One-way'}
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="px-5 py-2 text-sm font-bold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
            Edit Search
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-32 w-full">
        <div className="w-full flex flex-col items-center">
          
          <div className="space-y-6 w-full">
            
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse h-[140px]" />
                ))}
              </div>
            )}

            {!isLoading && sortedRoutes.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <p className="text-xl text-gray-500 font-medium">No routes found.</p>
              </div>
            )}

            {!isLoading && sortedRoutes.map((route, displayIdx) => {
              const originalIdx = route._originalIdx;
              const isBest = originalIdx === bestIdx;
              const isCheapest = originalIdx === cheapestIdx;
              const isFastest = originalIdx === fastestIdx;
              
              const isExpanded = expandedRoute === displayIdx;
              const legs = route.legs || [];

              return (
                <div 
                  key={displayIdx}
                  className={`group w-full max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden border ${isBest ? 'border-purple-200' : 'border-gray-200/60'} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${searchState.selectedRoute === route ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => toggleExpand(displayIdx)}
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        {isBest && <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-md tracking-wide shadow-sm flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> BEST OPTION</span>}
                        {isCheapest && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md tracking-wide flex items-center">CHEAPEST</span>}
                        {isFastest && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md tracking-wide flex items-center">FASTEST</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900">₹{(route._calcPrice || 0).toLocaleString()}</div>
                        <div className="text-sm font-semibold text-gray-500">{route.totalDuration || route.duration || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between w-full mt-6 mb-8 relative px-2">
                      <div className="absolute top-6 left-12 right-12 h-[2px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 z-0"></div>
                      {legs.map((leg: any, i: number) => (
                        <div key={i} className="relative z-10 flex flex-col items-center group gap-2 w-full">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md
                            ${(leg.mode || '').toLowerCase() === 'flight' ? 'bg-blue-50 text-blue-600' : 
                              (leg.mode || '').toLowerCase() === 'train' ? 'bg-green-50 text-green-600' : 
                              (leg.mode || '').toLowerCase() === 'bus' ? 'bg-orange-50 text-orange-600' :
                              'bg-indigo-50 text-indigo-600'}
                          `}>
                            {getModeIcon(leg.mode || 'info', "w-5 h-5")}
                          </div>
                          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest bg-white px-2 group-hover:text-gray-800 transition-colors">{leg.mode}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
                      <button className="text-sm font-semibold text-gray-500 hover:text-gray-800 flex items-center">
                        {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        {isExpanded ? 'Hide Details' : 'View Breakdown'}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSelectRoute(route); }}
                        className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg transform active:scale-95 z-10"
                      >
                        Select Route
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/80 px-6 py-5 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="relative pl-6 border-l-2 border-gray-200 ml-4 space-y-6">
                        {legs.map((leg: any, i: number) => (
                          <div key={i} className="relative">
                            <span className={`absolute -left-[33px] top-0 w-4 h-4 rounded-full border-4 border-white ${(leg.mode || '').toLowerCase() === 'flight' ? 'bg-blue-500' : (leg.mode || '').toLowerCase() === 'train' ? 'bg-green-500' : (leg.mode || '').toLowerCase() === 'bus' ? 'bg-orange-500' : 'bg-indigo-500'}`} />
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <div className="font-bold text-gray-900 flex items-center">
                                  {getModeIcon(leg.mode || 'info')}
                                  <span className="ml-2 capitalize">{leg.mode}</span>
                                </div>
                                <div className="text-sm text-gray-500 font-medium">
                                  {leg.origin} → {leg.destination}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">{leg.departureTime || 'TBD'} - {leg.arrivalTime || 'TBD'}</div>
                                <div className="text-sm text-gray-500 font-medium">{leg.duration || '--'}</div>
                              </div>
                            </div>
                            
                            {i < legs.length - 1 && legs[i+1]?.departureTime && leg.arrivalTime && (
                               <div className="my-4 p-3 bg-white rounded-xl text-sm font-semibold text-gray-500 w-max border border-gray-200 shadow-sm flex items-center">
                                 <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                 Layover at {leg.destination}
                               </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
