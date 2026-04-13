'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Info, CheckCircle, ChevronDown, ChevronUp, Plane, Train, Car, Bus } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useCurrency } from '@/hooks/useCurrency'
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
  const { t, language, hasHydrated: tHydrated } = useTranslation()
  const { tPrice, hasHydrated: cHydrated } = useCurrency()
  const hasHydrated = tHydrated && cHydrated
  const searchState = useSearchStore()
  const router = useRouter()
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null)

  useEffect(() => {
    if (hasHydrated && (!searchState.from || !searchState.to)) {
      router.replace('/');
    }
  }, [searchState.from, searchState.to, router, hasHydrated]);

  if (!hasHydrated) return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col items-center justify-center space-y-4">
      <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">Loading amazing journeys...</p>
    </div>
  );

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
    const rawScore = (r._calcPrice || 5000) * (parseDurationToMins(r.totalDuration || r.duration || '0h') || 1);
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
                {searchState.departureDate ? new Date(searchState.departureDate).toLocaleDateString(language === 'HI' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : t('anyDate')}
                {' '}• {searchState.tripType === 'round-trip' ? t('roundTrip') : t('oneWay')}
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="px-5 py-2 text-sm font-bold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
            {t('editSearch')}
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-32 w-full">
        <div className="w-full flex flex-col items-center">
          
          {searchState.isFallback && (
            <div className="w-full max-w-4xl mb-8 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-4 shrink-0">
                <Info className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-bold text-orange-900 text-sm">{t('offlineResults')}</h4>
                <p className="text-orange-700 text-xs">{t('offlineDesc')}</p>
              </div>
              <button 
                onClick={() => router.push('/')}
                className="ml-auto px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
              >
                {t('retryLive')}
              </button>
            </div>
          )}

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
                <p className="text-xl text-gray-500 font-medium">{t('noRoutes')}</p>
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
                        {isBest && <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-md tracking-wide shadow-sm flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> {t('bestOption')}</span>}
                        {isCheapest && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md tracking-wide flex items-center">{t('cheapest')}</span>}
                        {isFastest && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md tracking-wide flex items-center">{t('fastest')}</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900">{tPrice(route._calcPrice || 0)}</div>
                        <div className="text-sm font-semibold text-gray-500 mb-1">{route.totalDuration || route.duration || 'N/A'}</div>
                        {legs.some((l: any) => l.confidence_score) && (
                          <div className="flex items-center justify-end space-x-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${legs.some((l: any) => l.confidence_color === 'red') ? 'bg-red-500' : legs.some((l: any) => l.confidence_color === 'yellow') ? 'bg-yellow-500' : 'bg-green-500'}`} />
                             <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">{t('reliability')}</span>
                          </div>
                        )}
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
                          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest bg-white px-2 group-hover:text-gray-800 transition-colors text-center max-w-[80px] truncate">
                            {leg.name || t((leg.mode?.toLowerCase() || 'flight') as any)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
                      <button className="text-sm font-semibold text-gray-500 hover:text-gray-800 flex items-center">
                        {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        {isExpanded ? t('hideDetails') : t('viewBreakdown')}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSelectRoute(route); }}
                        className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg transform active:scale-95 z-10"
                      >
                        {t('selectRoute')}
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
                                  <span className="ml-2 capitalize leading-tight">
                                    <div className="text-gray-900 font-bold">{leg.name || t((leg.mode?.toLowerCase() || 'flight') as any)}</div>
                                    {leg.airline_logo && <img src={leg.airline_logo} alt="logo" className="h-4 mt-1" />}
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                  {tPrice(leg.selectedOption?.price || leg.price || 0)}
                                </p>
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
                                 {t('layoverAt')} {leg.destination}
                               </div>
                            )}

                            {/* Confidence Score for Trains/Flights */}
                            {(leg.confidence_score || leg.confidence_label) && (
                              <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${leg.confidence_color === 'green' ? 'bg-green-500' : leg.confidence_color === 'red' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <span className="text-sm font-bold text-gray-900">{t('reliability')}</span>
                                  </div>
                                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${leg.confidence_color === 'green' ? 'bg-green-100 text-green-700' : leg.confidence_color === 'red' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {leg.confidence_label}
                                  </span>
                                </div>
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-2xl font-black text-gray-900">{leg.confidence_score}%</span>
                                  <span className="text-sm font-semibold text-gray-500">{leg.on_time_note}</span>
                                </div>
                                {leg.is_real_time && (
                                  <div className="mt-2 flex items-center text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-max uppercase tracking-wider">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {t('livePrediction')}
                                  </div>
                                )}
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
