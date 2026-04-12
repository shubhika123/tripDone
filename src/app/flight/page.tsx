'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Plane, ChevronDown, ChevronUp, Bell, CheckCircle, Lock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'
import { useTranslation } from '@/hooks/useTranslation'
import { useCurrency } from '@/hooks/useCurrency'

const Chart = dynamic(() => import("./Chart"), { ssr: false });
export default function FlightPage() {
  const { t, hasHydrated: tHydrated } = useTranslation()
  const { tPrice, hasHydrated: cHydrated } = useCurrency()
  const hasHydrated = tHydrated && cHydrated
  const router = useRouter()
  const searchState = useSearchStore()
  
  const [expandedFlight, setExpandedFlight] = useState<number | null>(null)
  const [isBookedExternally, setIsBookedExternally] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState(searchState.phoneNumber || '')
  const [showPhoneModal, setShowPhoneModal] = useState(searchState.alertEnabled || false)
  const [phoneError, setPhoneError] = useState('')
  const [alertSuccess, setAlertSuccess] = useState(false)
  const [alertError, setAlertError] = useState(false)

  useEffect(() => {
    if (hasHydrated && (!searchState.from || !searchState.to || !searchState.selectedModes.includes('flight'))) {
      router.replace('/')
    }
  }, [hasHydrated, searchState, router])

  if (!hasHydrated) return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col items-center justify-center space-y-4 font-sans">
      <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">{t('loading') || 'Searching for flights...'}</p>
    </div>
  );

  const flights = searchState.flights || []
  
  const sortedFlights = [...flights].sort((a, b) => {
    const pA = a.price || 0;
    const pB = b.price || 0;
    return pA - pB;
  })

  const routeParams = searchState.from && searchState.to ? `${searchState.from}-${searchState.to}` : '';
  const dateParams = searchState.departureDate || new Date().toISOString().split('T')[0];
  const currentPrice = searchState.selectedFlight?.price || 0;

  const { data: priceIntelRaw, error: intelError } = useQuery({
    queryKey: ['price-predict', routeParams, dateParams, currentPrice],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tripdone-crl1.onrender.com'
      const res = await fetch(`${baseUrl}/api/predict?route=${routeParams}&date=${dateParams}&current_price=${currentPrice}`)
      if (!res.ok) throw new Error('Prediction API failed')
      return res.json()
    },
    enabled: !!routeParams && !!dateParams && currentPrice > 0,
    retry: 1,
    staleTime: 5 * 60 * 1000
  })

  // Debug mandatory checkpoint
  console.log({
    route: routeParams,
    date: dateParams,
    price: currentPrice,
    predictionData: priceIntelRaw
  })

  const formatShortDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } catch (e) {
        return dateStr || ''
      }
  }

  const fallbackPredictions = [
    { date: "Today", price: currentPrice },
    { date: "Tomorrow", price: currentPrice + 150 },
    { date: "Day 3", price: currentPrice - 80 },
    { date: "Day 4", price: currentPrice + 60 },
    { date: "Day 5", price: currentPrice - 120 }
  ];

  const hasApiData = priceIntelRaw?.predictions?.length > 0;
  const sourceArray = hasApiData ? priceIntelRaw.predictions : fallbackPredictions;

  const chartData = sourceArray.map((item: any) => ({
      date: hasApiData ? formatShortDate(item.date) : item.date,
      price: Number(item.price)
  }));

  let trendUi = null;
  let recommendationText = "Prices stable — safe to book";
  
  if (hasApiData && priceIntelRaw?.recommendation) {
      const rec = priceIntelRaw.recommendation;
      if (rec === 'buy') {
          trendUi = <div className="text-green-600 font-bold text-sm bg-green-50 p-4 rounded-xl mt-4 w-full flex items-center justify-center">✅ {t('priceDropTrend')}</div>
          recommendationText = t('recBuy');
      } else if (rec === 'wait') {
          trendUi = <div className="text-red-600 font-bold text-sm bg-red-50 p-4 rounded-xl mt-4 w-full flex items-center justify-center">❌ {t('priceRiseTrend')}</div>
          recommendationText = t('recWait');
      } else if (rec === 'stable') {
          trendUi = <div className="text-yellow-600 font-bold text-sm bg-yellow-50 p-4 rounded-xl mt-4 w-full flex items-center justify-center">⚠️ {t('priceStableTrend')}</div>
          recommendationText = t('recHold');
      }
  } else {
      if (chartData.length > 0) {
          const avg = chartData.reduce((a: number, b: any) => a + b.price, 0) / chartData.length;
          const isNearAvg = Math.abs(currentPrice - avg) < (avg * 0.05);

          if (isNearAvg) {
              trendUi = <div className="text-yellow-600 font-bold text-sm bg-yellow-50 p-4 rounded-xl mt-4 w-full flex items-center justify-center">⚠️ {t('priceStableTrend')}</div>
              recommendationText = t('recHold');
          } else if (currentPrice < avg) {
              trendUi = <div className="text-green-600 font-bold text-sm bg-green-50 p-4 rounded-xl mt-4 w-full flex items-center justify-center">✅ {t('priceDropTrend')}</div>
              recommendationText = t('recBuy');
          } else {
              trendUi = <div className="text-red-600 font-bold text-sm bg-red-50 p-4 rounded-xl mt-4 w-full flex items-center justify-center">❌ {t('priceRiseTrend')}</div>
              recommendationText = t('recWait');
          }
      }
  }

  const alertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tripdone-crl1.onrender.com'
      const res = await fetch(`${baseUrl}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Alert POST failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      setAlertSuccess(true)
      setAlertError(false)
      searchState.setSearch({ alertEnabled: true, phoneNumber: variables.phone })
      setTimeout(() => {
         setAlertSuccess(false)
      }, 4000)
    },
    onError: () => {
      setAlertError(true)
      setAlertSuccess(false)
    }
  })

  const handleSetAlert = () => {
    setPhoneError('')
    setAlertError(false)
    setAlertSuccess(false)
    
    if (isNaN(Number(whatsappPhone)) || whatsappPhone.length !== 10) {
      setPhoneError(t('alertError'))
      return;
    }
    if (!searchState.selectedFlight) {
      setPhoneError(t('pleaseSelect'))
      return;
    }

    const payload = {
      route: `${searchState.from}-${searchState.to}`,
      date: searchState.departureDate || new Date().toISOString().split('T')[0],
      phone: whatsappPhone,
      current_price: searchState.selectedFlight.price || 0
    }
    
    alertMutation.mutate(payload)
  }

  const getNextMode = () => {
    const currentIndex = searchState.selectedModes.indexOf('flight')
    return searchState.selectedModes[currentIndex + 1] || null
  }

  const handleFinalize = () => {
    if (isBookedExternally) {
      searchState.setSearch({
        skippedModes: [...(searchState.skippedModes || []), 'flight'],
        completedSteps: [...(searchState.completedSteps || []), 'flight']
      })
    } else {
      searchState.setSearch({
        completedSteps: [...(searchState.completedSteps || []), 'flight']
      })
    }

    const next = getNextMode()
    if (next) {
      router.push(`/${next.toLowerCase()}`)
    } else {
      router.push('/summary')
    }
  }



  if (!searchState.selectedModes.includes('flight')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
      <Navbar />

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Plane className="w-5 h-5 mr-2 text-blue-600" />
              {t('departureBooking')}: {t('flight')}
            </h1>
          </div>
          <div className="flex space-x-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
            {searchState.selectedModes.map((m, i) => {
              const isCompleted = (searchState.completedSteps || []).includes(m)
              return (
                <div key={i} className={`flex items-center ${m === 'flight' ? 'text-blue-600' : isCompleted ? 'text-green-500' : ''}`}>
                  <span>{t(m.toLowerCase() as any)}</span>
                  {isCompleted && <CheckCircle className="w-4 h-4 ml-1" />}
                  {i < searchState.selectedModes.length - 1 && <span className="mx-2 text-gray-300">→</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">{t('topPriority')} {t('flight')}s</h2>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-200 rounded-full shadow-sm">
               <input 
                 type="checkbox" 
                 id="external"
                 className="w-4 h-4 text-blue-600 rounded"
                 checked={isBookedExternally}
                 onChange={(e) => setIsBookedExternally(e.target.checked)}
               />
               <label htmlFor="external" className="text-sm font-bold text-gray-700 cursor-pointer">✓ {t('alreadyBooked')}</label>
            </div>
          </div>

          <div className={`space-y-4 ${isBookedExternally ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             {sortedFlights.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <Plane className="w-10 h-10 mx-auto text-gray-300 mb-4" />
                  <p className="text-xl text-gray-500 font-medium">{t('noAvailable').replace('{mode}', t('flight'))}</p>
                </div>
             )}

             {sortedFlights.map((flight, idx) => {
               const isSelected = searchState.selectedFlight === flight
               const isExpanded = expandedFlight === idx
               return (
                 <div key={idx} className={`bg-white rounded-3xl overflow-hidden border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : 'border-gray-200 shadow-sm'} transition-all`}>
                   
                    <div className="p-6 cursor-pointer" onClick={() => setExpandedFlight(isExpanded ? null : idx)}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center font-bold text-gray-600 shadow-sm overflow-hidden p-1.5">
                            {flight.airline_logo ? (
                              <img src={flight.airline_logo} alt={flight.airline} className="w-full h-full object-contain" />
                            ) : (
                              <span>{flight.airline?.charAt(0) || '✈'}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-lg leading-tight">{flight.airline || 'Airline'}</h3>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{flight.flight_number || ''}</div>
                          </div>
                        </div>
                        <div className="flex-1 px-8 flex items-center justify-center space-x-6">
                           <div className="text-center">
                              <div className="text-xl font-black text-gray-900">{flight.departureTime || '08:00'}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{flight.from || '---'}</div>
                           </div>
                           <div className="flex flex-col items-center flex-1 max-w-[120px]">
                              <div className="text-[10px] font-bold text-gray-500 mb-1">{flight.duration || '--'}</div>
                              <div className="w-full h-[2px] bg-gray-200 relative">
                                 <div className="absolute -top-1 left-0 w-2 h-2 bg-gray-200 rounded-full"></div>
                                 <div className="absolute -top-1 right-0 w-2 h-2 bg-gray-200 rounded-full"></div>
                                 <Plane className="w-3 h-3 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" />
                              </div>
                              <div className="text-[10px] font-bold text-blue-600 mt-1">{flight.stops === 0 ? t('nonStop') || 'Non-stop' : `${flight.stops} ${flight.stops === 1 ? t('stop') : t('stops')}`}</div>
                           </div>
                           <div className="text-center">
                              <div className="text-xl font-black text-gray-900">{flight.arrivalTime || '10:00'}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{flight.to || '---'}</div>
                           </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-gray-900 leading-none mb-1">{tPrice(flight.price || 0)}</div>
                          <button className="text-xs font-bold text-blue-600 flex items-center justify-end w-full">
                            {isExpanded ? t('closeDetails') : t('viewBooking')} 
                            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                          </button>
                        </div>
                      </div>
                    </div>

                   {isExpanded && (
                     <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                        <h4 className="font-bold text-gray-900 mb-4">{t('availablePlatforms')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {['Expedia', 'MakeMyTrip', 'Official Airline'].map(platform => {
                              const isPlatformSelected = isSelected && searchState.selectedFlightPlatform === platform
                              return (
                                <button 
                                  key={platform}
                                  onClick={() => searchState.setSearch({ selectedFlight: flight, selectedFlightPlatform: platform })}
                                  className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${isPlatformSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-900 hover:border-blue-300'}`}
                                >
                                  <span className="font-bold">{platform}</span>
                                  <span className="font-semibold">{isPlatformSelected ? t('selected') : tPrice(flight.price || 0)}</span>
                                </button>
                              )
                           })}
                        </div>
                     </div>
                   )}

                 </div>
               )
             })}
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="font-black text-gray-900 text-lg">{t('priceIntelligence')}</h3>
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${hasApiData ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {hasApiData ? t('livePrediction') : t('estimatedTrend')}
                </span>
              </div>
              <button 
                onClick={() => setShowPhoneModal(!showPhoneModal)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${searchState.alertEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}
              >
                {searchState.alertEnabled ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
            </div>
            
            {showPhoneModal && (
              <div className="mb-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-inner">
                <p className="text-sm font-semibold text-blue-900 mb-3">{t('getWhatsApp')}</p>
                <div className="flex flex-col gap-3">
                  <input 
                    type="tel" 
                    placeholder={t('phonePlaceholder')} 
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 transition-colors ${phoneError ? 'border-red-300 focus:ring-red-500' : 'border-indigo-200 focus:ring-indigo-500'} ${searchState.alertEnabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}`} 
                    value={whatsappPhone}
                    onChange={(e) => {
                       setWhatsappPhone(e.target.value)
                       if (phoneError) setPhoneError('')
                       if (alertError) setAlertError(false)
                    }}
                    disabled={searchState.alertEnabled}
                  />
                  <button 
                    onClick={handleSetAlert}
                    disabled={alertMutation.isPending || searchState.alertEnabled || whatsappPhone.length !== 10}
                    className={`w-full h-11 flex items-center justify-center rounded-lg font-medium text-white transition-all
                      ${searchState.alertEnabled ? 'bg-green-600 hover:bg-green-700' : alertError ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                      ${(alertMutation.isPending || searchState.alertEnabled || whatsappPhone.length !== 10) ? 'opacity-50 cursor-not-allowed' : 'shadow-sm'}
                    `}
                  >
                    {alertMutation.isPending ? (
                       <span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading...</span>
                    ) : searchState.alertEnabled ? (
                       t('alertSet')
                    ) : alertError ? (
                       t('retryLive')
                    ) : (
                       t('getAlerts')
                    )}
                  </button>
                </div>
                
                {phoneError && <p className="text-xs font-bold text-red-500 mt-2">{phoneError}</p>}
                
                {alertSuccess && (
                   <p className="text-xs font-bold text-green-600 mt-2 animate-in fade-in duration-300">{t('alertSuccess')}</p>
                )}
                
                {alertError && (
                   <p className="text-xs font-bold text-red-500 mt-2 animate-in fade-in duration-300">{t('alertError')}</p>
                )}
              </div>
            )}

               <div className="w-full">
                  <div className="h-[220px] w-full">
                    <Chart chartData={chartData} currentPrice={currentPrice} tPrice={tPrice} />
                  </div>
                 
                 {trendUi}

                 <div className="mt-6 flex rounded-full h-2.5 overflow-hidden shadow-inner bg-gray-100">
                    <div className="bg-green-500 w-1/3 border-r border-white"></div>
                    <div className="bg-yellow-400 w-1/3 border-r border-white"></div>
                    <div className="bg-red-500 w-1/3"></div>
                 </div>
                 <div className="flex justify-between text-xs font-black text-gray-500 mt-2 px-1 uppercase tracking-wider">
                   <span className="text-green-600">{t('low')}</span>
                   <span className="text-yellow-600">{t('avg')}</span>
                   <span className="text-red-600">{t('high')}</span>
                 </div>
               </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl group bg-gradient-to-br from-indigo-900 to-purple-900 transition-all duration-300">
             <div className="absolute top-0 right-0 p-8 border-[60px] border-transparent border-t-white/10 border-r-white/10 rounded-full"></div>
             
             {!searchState.isProUnlocked ? (
               <div className="relative z-10 p-6 flex flex-col items-center justify-center text-center">
                 <div className="blur-sm opacity-60">
                   <h4 className="text-white font-bold text-lg mb-2">{t('recStrategy')}</h4>
                   <p className="text-indigo-200 text-sm font-medium mb-4 select-none">
                     {recommendationText}
                   </p>
                   <div className="px-6 py-2 bg-white text-indigo-900 font-black rounded-xl opacity-0">Placeholder</div>
                 </div>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Lock className="w-8 h-8 text-white/50 mb-3" />
                    <button 
                      onClick={() => searchState.setProUnlocked()}
                      className="px-6 py-2 bg-white text-indigo-900 font-black rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/50"
                    >
                      {t('unlockPro')}
                    </button>
                 </div>
               </div>
             ) : (
               <div className="relative z-10 p-6 flex flex-col justify-center text-center transition-all duration-300">
                  <div className="flex justify-center mb-3">
                     <span className="bg-indigo-800 text-indigo-100 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">{t('proInsight')}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{t('recStrategy')}</h3>
                  <p className="text-indigo-100 font-medium">{recommendationText}</p>
               </div>
             )}
          </div>

        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] py-4 z-50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div>
             {isBookedExternally ? (
               <div className="font-bold text-gray-900">{t('skipping')} {t('flight')}</div>
             ) : searchState.selectedFlight ? (
               <div>
                  <span className="text-gray-500 font-semibold text-sm">{t('selectedRouteLabel')}</span>
                  <div className="font-black text-gray-900 text-lg">{tPrice(searchState.selectedFlight.price || 0)} • {searchState.selectedFlightPlatform}</div>
               </div>
             ) : (
               <div className="text-gray-500 font-semibold text-sm">{t('pleaseSelect')}</div>
             )}
           </div>
           
           <button 
             onClick={handleFinalize}
             disabled={!isBookedExternally && (!searchState.selectedFlight || !searchState.selectedFlightPlatform)}
             className="flex items-center px-8 py-3.5 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
           >
             {t('continueTo')} {t(getNextMode()?.toLowerCase() as any || 'summary')} 
             <ArrowRight className="w-5 h-5 ml-2" />
           </button>
        </div>
      </div>
    </div>
  )
}
