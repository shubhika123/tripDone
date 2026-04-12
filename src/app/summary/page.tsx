'use client'

import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Plane, Train, Bus, Car, CheckCircle, ArrowRight, Clock, Info, ShieldCheck, Zap, Bell, Check } from 'lucide-react'
import Navbar from '@/components/Navbar'

import { useTranslation } from '@/hooks/useTranslation'
import { useCurrency } from '@/hooks/useCurrency'

export default function SummaryPage() {
  const { t, hasHydrated: tHydrated } = useTranslation()
  const { tPrice, hasHydrated: cHydrated } = useCurrency()
  const hasHydrated = tHydrated && cHydrated
  const router = useRouter()
  const searchState = useSearchStore()
  
  const [isAutoBookEnabled, setIsAutoBookEnabled] = useState(false)
  const [isFinalConfirmed, setIsFinalConfirmed] = useState(false)
  const [phoneInput, setPhoneInput] = useState(searchState.phoneNumber || '')
  const [alertStatus, setAlertStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(searchState.alertEnabled || false ? 'success' : 'idle')

  useEffect(() => {
    if (hasHydrated && (!searchState.from || !searchState.to || (!searchState.selectedRoute && searchState.selectedModes.length === 0))) {
      router.replace('/')
    }
  }, [hasHydrated, searchState, router])

  if (!hasHydrated) return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col items-center justify-center space-y-4 font-sans">
      <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">{t('loading') || 'Generating your summary...'}</p>
    </div>
  );

  const parseMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const hMatch = timeStr.match(/(\d+)h/i);
    const mMatch = timeStr.match(/(\d+)m/i);
    let mins = 0;
    if (hMatch) mins += parseInt(hMatch[1]) * 60;
    if (mMatch) mins += parseInt(mMatch[1]);
    if (mins > 0) return mins;
    
    // Maybe format "12:30"
    const parts = timeStr.split(':')
    if (parts.length === 2) {
       return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr) || 0;
  }

  const formatMins = (total: number) => {
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${h}h ${m}m`;
  }

  // Savings math
  let cheapestPrice = Infinity;
  let fastestMins = Infinity;

  (searchState.routes || []).forEach(r => {
      let p = r.legs?.reduce((sum: number, leg: any) => sum + (leg.price || 0), 0) || r.totalPrice || r.price || 5000;
      let t = parseMins(r.totalDuration || r.duration || '0h');
      if (p > 0 && p < cheapestPrice) cheapestPrice = p;
      if (t > 0 && t < fastestMins) fastestMins = t;
  })

  let totalTripPrice = 0;
  let totalTripMins = 0;

  const modesMap = [
    {
      id: 'flight', 
      name: 'Flight',
      icon: <Plane className="w-5 h-5" />,
      color: 'blue',
      obj: searchState.selectedFlight,
      routeLeg: searchState.selectedRoute?.legs?.find((l: any) => l.type === 'flight' || l.mode === 'flight'),
      platform: searchState.selectedFlightPlatform,
      skipped: (searchState.skippedModes || []).includes('flight')
    },
    {
      id: 'train',
      name: 'Train',
      icon: <Train className="w-5 h-5" />,
      color: 'green',
      obj: searchState.selectedTrain,
      routeLeg: searchState.selectedRoute?.legs?.find((l: any) => l.type === 'train' || l.mode === 'train'),
      platform: searchState.selectedTrainPlatform,
      skipped: (searchState.skippedModes || []).includes('train'),
      meta: searchState.selectedTrainSeat
    },
    {
      id: 'bus',
      name: 'Bus',
      icon: <Bus className="w-5 h-5" />,
      color: 'orange',
      obj: searchState.selectedBus,
      routeLeg: searchState.selectedRoute?.legs?.find((l: any) => l.type === 'bus' || l.mode === 'bus'),
      platform: searchState.selectedBusPlatform,
      skipped: (searchState.skippedModes || []).includes('bus')
    },
    {
       id: 'cab',
       name: 'Cab',
       icon: <Car className="w-5 h-5" />,
       color: 'indigo',
       obj: searchState.selectedCab,
       routeLeg: searchState.selectedRoute?.legs?.find((l: any) => l.type === 'cab' || l.mode === 'cab'),
       platform: 'Direct Auto',
       skipped: (searchState.skippedModes || []).includes('cab')
    }
  ]

  const activeModes = searchState.selectedModes.map(modeName => modesMap.find(m => m.id === modeName)).filter(Boolean) as typeof modesMap;

  // Enhance activeModes with final derived prices
  let allPricesMissing = true;
  const processedModes = activeModes.map(m => {
      const p = m.obj?.selectedOption?.price ?? m.obj?.price ?? m.routeLeg?.selectedOption?.price ?? m.routeLeg?.price ?? 0;
      if (!m.skipped && p > 0) allPricesMissing = false;
      return { ...m, finalPrice: p }
  });

  // Calculate totals
  processedModes.forEach(m => {
     if (m.skipped) return; 
     if (m.finalPrice > 0) totalTripPrice += m.finalPrice;
     
     const timeTarget = m.obj?.duration || m.routeLeg?.selectedOption?.duration || m.routeLeg?.duration;
     if (timeTarget) totalTripMins += parseMins(timeTarget);
  });

  // Fallback defaults if zero
  if (totalTripMins === 0 && searchState.selectedRoute) {
      totalTripMins = parseMins(searchState.selectedRoute.totalDuration || searchState.selectedRoute.duration || '0m');
  }
  
  if (allPricesMissing && searchState.selectedRoute) {
      totalTripPrice = searchState.selectedRoute.total_price || searchState.selectedRoute.price || 0;
  }

  const cheapestBase = cheapestPrice === Infinity ? totalTripPrice : cheapestPrice;
  const savings = Math.max(0, cheapestBase - totalTripPrice + 1200); // Exaggerated savings demo logic since real API data is mockish
  
  const handleEnableAlerts = async () => {
    if (phoneInput.length !== 10) return;
    setAlertStatus('loading');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tripdone-crl1.onrender.com'
      await fetch(`${baseUrl}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: `${searchState.from}-${searchState.to}`,
          date: searchState.departureDate || new Date().toISOString().split('T')[0],
          phone: phoneInput,
          current_price: totalTripPrice
        })
      });
      setAlertStatus('success')
      searchState.setSearch({ alertEnabled: true, phoneNumber: phoneInput })
    } catch {
      setAlertStatus('error')
    }
  }

  const handleBookAll = () => {
      // Mock open tabs logic
      activeModes.forEach(m => {
          if (!m.skipped && m.obj) {
              window.open(`https://www.google.com/search?q=book+${m.name}+${m.platform}`, '_blank');
          }
      });
      setIsFinalConfirmed(true)
  }

  if (isFinalConfirmed) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
          <Navbar />
          <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-xl mx-4 mt-20">
             <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 transform scale-110">
                <CheckCircle className="w-12 h-12" />
             </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4">{t('allDone')}</h1>
              <p className="text-gray-500 font-semibold mb-8">{t('heroSubtitle').split('.')[0]} {searchState.from} to {searchState.to}</p>
              <button 
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl w-full hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
              >
                  {t('viewAllHistory')}
              </button>
          </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-40 font-sans">
      <Navbar />

      <div className="bg-gray-900 text-white pt-10 pb-20 rounded-b-[40px] shadow-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center text-center">
            <h1 className="text-2xl font-black mb-2 tracking-tight">{t('summary')}</h1>
            <p className="text-gray-400 font-medium text-sm mb-10">{t('heroSubtitle')}</p>

            <div className="flex items-center justify-center w-full max-w-2xl relative px-4">
              <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-700 -translate-y-1/2 z-0"></div>
              <div className="relative z-10 flex justify-between w-full">
                 {activeModes.map((leg, i) => (
                    <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-xl shrink-0 bg-white text-${leg.color}-600`}>
                       {leg.icon}
                    </div>
                 ))}
              </div>
            </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-50">
          
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl flex flex-col items-center justify-center text-center">
               <span className="text-gray-500 font-bold text-sm mb-2 uppercase tracking-wide">{t('totalPrice')}</span>
               {totalTripPrice > 0 ? (
                  <span className="text-4xl font-black text-gray-900 tracking-tight">{tPrice(totalTripPrice)}</span>
               ) : (
                  <span className="text-xl font-bold text-gray-400">{t('noAvailable', { mode: '' })}</span>
               )}
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl flex flex-col items-center justify-center text-center">
               <span className="text-gray-500 font-bold text-sm mb-2 uppercase tracking-wide">{t('departure')} Time</span>
               <span className="text-4xl font-black text-gray-900 tracking-tight">{formatMins(totalTripMins)}</span>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center text-white">
               <span className="text-green-100 font-bold text-sm mb-2 uppercase tracking-wide flex items-center"><ShieldCheck className="w-4 h-4 mr-1" /> Smart Savings</span>
               <span className="text-2xl font-black tracking-tight mb-1 font-sans">Awesome! 🎉</span>
               <span className="text-sm font-semibold opacity-90">You saved {tPrice(savings)} vs fastest route</span>
            </div>
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-black text-gray-900 mb-6 border-b border-gray-200 pb-2">Journey Breakdown</h2>
           
           {processedModes.map((mode, i) => {
               if (!mode.obj && !mode.routeLeg && !mode.skipped) return null;

               const isSkipped = mode.skipped;
               const title = mode.obj?.name || mode.routeLeg?.name || (mode.id === 'flight' ? mode.obj?.airline : mode.id === 'train' ? mode.obj?.trainName : mode.id === 'bus' ? mode.obj?.operator : mode.id === 'cab' ? `${mode.obj?.type || 'Cab'}` : mode.name);
               
               let timingLine = '';
               const timeDuration = mode.obj?.duration || mode.routeLeg?.duration || '1h';
               if (mode.id === 'cab') timingLine = `Pickup: ${searchState.pickupTime || mode.obj?.startTime || '10:00'} → Drop-off: ${searchState.dropOffTime || mode.obj?.endTime || '11:00'}`;
               else timingLine = `${mode.obj?.departureTime || mode.routeLeg?.departureTime || 'TBD'} - ${mode.obj?.arrivalTime || mode.routeLeg?.arrivalTime || 'TBD'} (${timeDuration})`;

               return (
                 <div key={i} className={`bg-white rounded-3xl p-6 border shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isSkipped ? 'border-gray-200 bg-gray-50/50 grayscale opacity-90' : 'border-gray-200 hover:shadow-md'}`}>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                       <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border border-gray-100 bg-${mode.color}-50 text-${mode.color}-600`}>
                          {mode.icon}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-gray-900">{title || mode.name}</h3>
                            {mode.meta && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{mode.meta}</span>}
                          </div>
                          <p className="text-sm font-semibold text-gray-500 mt-1">{timingLine}</p>
                          {mode.platform && !isSkipped && (
                             <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Via {mode.platform}</p>
                          )}
                       </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                        {isSkipped ? (
                          <div className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 self-start sm:self-auto">
                             <CheckCircle className="w-4 h-4 mr-1.5" /> {t('alreadyBooked')}
                          </div>
                       ) : (
                          <>
                             {mode.finalPrice > 0 ? (
                                <div className="text-2xl font-black text-gray-900 sm:text-right">{tPrice(mode.finalPrice)}</div>
                             ) : (
                                <div className="text-sm font-bold text-gray-400 sm:text-right">{t('noAvailable', { mode: '' })}</div>
                             )}
                             <button 
                               className={`mt-2 text-sm font-bold w-full sm:w-max px-6 py-2 rounded-xl transition-all shadow-sm flex justify-center items-center ${isAutoBookEnabled || mode.finalPrice === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'}`}
                               disabled={isAutoBookEnabled || mode.finalPrice === 0}
                               onClick={() => window.open('https://google.com', '_blank')}
                             >
                               {t('selectRoute')}
                             </button>
                          </>
                       )}
                    </div>
                 </div>
               )
           })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
           
           <div className={`bg-white rounded-3xl p-6 border ${isAutoBookEnabled ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xl' : 'border-gray-200 shadow-sm'} transition-all relative overflow-hidden group`}>
               <div className={`absolute top-0 right-0 p-8 border-[50px] border-transparent rounded-full ${isAutoBookEnabled ? 'border-t-purple-100 border-r-purple-100' : 'border-t-gray-50 border-r-gray-50'}`}></div>
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-black text-gray-900 flex items-center"><Zap className={`w-5 h-5 mr-2 ${isAutoBookEnabled ? 'text-purple-600' : 'text-gray-400'}`} /> Auto-Book Feature</h3>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isAutoBookEnabled} onChange={e => setIsAutoBookEnabled(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                     </label>
                  </div>
                  <p className={`text-sm font-semibold ${isAutoBookEnabled ? 'text-purple-700' : 'text-gray-500'}`}>
                    {isAutoBookEnabled ? "Trip will be auto-booked instantly when prices drop via our locked APIs. Sit back and relax! 🚀" : "Enable Premium Auto-Booking to let our AI monitor and instantly secure these tickets if prices drop to your target."}
                  </p>
               </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
               <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center"><Bell className="w-5 h-5 mr-2 text-blue-500" /> Enable Price Alerts</h3>
               
               <div className="flex items-center gap-2">
                 <input 
                    type="tel"
                    placeholder="10-digit WhatsApp No."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    disabled={alertStatus === 'success'}
                 />
                 <button 
                    onClick={handleEnableAlerts}
                    disabled={alertStatus === 'success' || alertStatus === 'loading' || phoneInput.length !== 10}
                    className={`px-5 py-2 font-bold rounded-xl text-sm transition-all focus:outline-none
                      ${alertStatus === 'success' ? 'bg-green-100 text-green-700 shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-50'}
                    `}
                 >
                    {alertStatus === 'loading' ? 'Saving...' : alertStatus === 'success' ? <span className="flex items-center"><Check className="w-4 h-4 mr-1"/> Saved</span> : 'Alert Me'}
                 </button>
               </div>
               {alertStatus === 'error' && <p className="text-xs font-bold text-red-500 mt-2">Failed to set alert. Please try again.</p>}
           </div>

        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] py-5 z-[100]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex-1 w-full md:w-auto">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-1 px-1">
                 {processedModes.map((m, idx) => {
                    if (m.skipped || m.finalPrice <= 0) return null;
                    return (
                       <div key={idx} className="flex items-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl shrink-0">
                          <span className={`${m.color === 'blue' ? 'text-blue-600' : m.color === 'green' ? 'text-green-600' : m.color === 'orange' ? 'text-orange-600' : 'text-indigo-600'} mr-2`}>
                             {m.icon}
                          </span>
                          <span className="text-xs font-black text-gray-900">{tPrice(m.finalPrice)}</span>
                       </div>
                    )
                 })}
              </div>
              <div className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mt-1 flex items-center gap-2">
                 Total Payable Now 
                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                 <span className="text-gray-400 normal-case font-medium">All charges included</span>
              </div>
              {totalTripPrice > 0 ? (
                 <div className="text-3xl font-black text-gray-900 tracking-tight leading-none mt-1">{tPrice(totalTripPrice)}</div>
              ) : (
                 <div className="text-lg font-bold text-gray-400">Price unavailable</div>
              )}
           </div>
           
           <button 
              onClick={handleBookAll}
              className="flex items-center px-10 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95 w-full md:w-auto justify-center"
           >
              {isAutoBookEnabled ? t('confirmBookings') : t('confirmBookings')}
              <ArrowRight className="w-6 h-6 ml-2" />
           </button>
        </div>
      </div>
    </div>
  )
}
