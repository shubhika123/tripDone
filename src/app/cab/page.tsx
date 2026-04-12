'use client'

import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Car, CheckCircle, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'

import { useTranslation } from '@/hooks/useTranslation'
import { useCurrency } from '@/hooks/useCurrency'

export default function CabPage() {
  const { t, hasHydrated: tHydrated } = useTranslation()
  const { tPrice, hasHydrated: cHydrated } = useCurrency()
  const hasHydrated = tHydrated && cHydrated
  const router = useRouter()
  const searchState = useSearchStore()
  
  const [isBookedExternally, setIsBookedExternally] = useState(false)
  const [pickupTimeInput, setPickupTimeInput] = useState<string>('')
  const [timeError, setTimeError] = useState<string>('')

  useEffect(() => {
    if (hasHydrated && (!searchState.from || !searchState.to || !searchState.selectedModes.includes('cab'))) {
      router.replace('/')
    }
  }, [hasHydrated, searchState, router])

  if (!hasHydrated) return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col items-center justify-center space-y-4 font-sans">
      <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">{t('loading') || 'Searching for cabs...'}</p>
    </div>
  );

  const cabs = searchState.taxi || [];
  
  // Previous Mode Context
  let previousArrivalTime: string | null = null;
  let previousDestination: string | null = null;
  
  const cabModeIndex = searchState.selectedModes.indexOf('cab')
  if (cabModeIndex > 0) {
    const prevMode = searchState.selectedModes[cabModeIndex - 1];
    if (prevMode === 'bus' && searchState.selectedBus) {
        previousArrivalTime = searchState.selectedBus.arrivalTime;
        previousDestination = searchState.selectedBus.droppingPoint || searchState.to;
    } else if (prevMode === 'train' && searchState.selectedTrain) {
        previousArrivalTime = searchState.selectedTrain.arrivalTime;
        previousDestination = searchState.to;
    } else if (prevMode === 'flight' && searchState.selectedFlight) {
        previousArrivalTime = searchState.selectedFlight.arrivalTime;
        previousDestination = searchState.to;
    }
  }

  // If no previous destination found perfectly, fallback to searchState.to
  if (!previousDestination) {
      previousDestination = searchState.to || 'City';
  }

  const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      try {
          const parts = timeStr.split(':')
          if (parts.length >= 2) {
              const h = parseInt(parts[0], 10)
              const m = parseInt(parts[1], 10)
              return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
          }
      } catch (e) {}
      return 0
  }

  const formatTime = (totalMins: number) => {
     let h = Math.floor(totalMins / 60) % 24;
     let m = totalMins % 60;
     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
     if (previousArrivalTime && !pickupTimeInput) {
         // Auto suggest +30 mins buffer
         const arrMins = parseTime(previousArrivalTime);
         setPickupTimeInput(formatTime(arrMins + 30));
     } else if (!pickupTimeInput) {
         // Default fallback if no previous time
         setPickupTimeInput('10:00');
     }
  }, [previousArrivalTime])

  const validateTime = (val: string) => {
     setPickupTimeInput(val);
     if (previousArrivalTime) {
         const arrMins = parseTime(previousArrivalTime);
         const picMins = parseTime(val);
         if (picMins < arrMins) {
             setTimeError("Pickup time cannot be before arrival");
         } else {
             setTimeError("");
         }
     } else {
         setTimeError("");
     }
  }

  const getNextMode = () => {
    const currentIndex = searchState.selectedModes.indexOf('cab')
    return searchState.selectedModes[currentIndex + 1] || null
  }

  const parseDurationStr = (dur: string) => {
      if (!dur) return 60;
      const t = parseTime(dur);
      if (t > 0) return t;

      const hMatch = dur.match(/(\d+)h/i);
      const mMatch = dur.match(/(\d+)m/i);
      let mins = 0;
      if (hMatch) mins += parseInt(hMatch[1]) * 60;
      if (mMatch) mins += parseInt(mMatch[1]);
      return mins > 0 ? mins : 60;
  }

  const handleFinalize = () => {
    let finalDropOffTime = null;

    if (!isBookedExternally && searchState.selectedCab) {
         const durMins = parseDurationStr(searchState.selectedCab.duration || '1h 0m');
         const picMins = parseTime(pickupTimeInput);
         finalDropOffTime = formatTime(picMins + durMins);
    }

    if (isBookedExternally) {
      searchState.setSearch({
        pickupTime: pickupTimeInput,
        skippedModes: [...(searchState.skippedModes || []), 'cab'],
        completedSteps: [...(searchState.completedSteps || []), 'cab']
      })
    } else {
      searchState.setSearch({
        pickupTime: pickupTimeInput,
        dropOffTime: finalDropOffTime,
        completedSteps: [...(searchState.completedSteps || []), 'cab']
      })
    }

    const next = getNextMode()
    if (next) {
      router.push(`/${next.toLowerCase()}`)
    } else {
      router.push('/summary')
    }
  }

  if (!searchState.selectedModes.includes('cab')) {
    return null;
  }

  const sortedCabs = [...cabs].sort((a, b) => (a.price || Infinity) - (b.price || Infinity))

  return (
    <div className="min-h-screen bg-gray-50/50 pb-28 font-sans">
      <Navbar />

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Car className="w-5 h-5 mr-2 text-indigo-600" />
              {t('departureBooking', { mode: t('cab') })}
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
               {t('heroSubtitle').split('.')[1] || 'Choose your ride to complete your journey.'}
            </p>
          </div>
          <div className="flex space-x-2 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {searchState.selectedModes.map((m, i) => {
              const isCompleted = (searchState.completedSteps || []).includes(m)
              return (
                <div key={i} className={`flex items-center shrink-0 ${m === 'cab' ? 'text-indigo-600' : isCompleted ? 'text-green-500' : ''}`}>
                  <span>{m}</span>
                  {isCompleted && <CheckCircle className="w-4 h-4 ml-1" />}
                  {i < searchState.selectedModes.length - 1 && <span className="mx-2 text-gray-300">→</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
             {previousArrivalTime && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-800 rounded-xl font-semibold border border-blue-100 shadow-sm">
                   <Clock className="w-4 h-4 mr-2 text-blue-600" />
                   Arriving at {previousDestination} at {previousArrivalTime}
                </div>
             )}
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-200 rounded-full shadow-sm hover:border-indigo-300 transition-colors">
              <input 
                type="checkbox" 
                id="external"
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer ring-indigo-500 focus:ring-indigo-500"
                checked={isBookedExternally}
                onChange={(e) => {
                   setIsBookedExternally(e.target.checked)
                   if (e.target.checked) setTimeError('')
                }}
              />
              <label htmlFor="external" className="text-sm font-bold text-gray-700 cursor-pointer">✓ {t('alreadyBooked')}</label>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm mb-8 w-full md:w-max">
           <label className="block text-sm font-bold text-gray-900 mb-2">{t('departure')} Time <span className="text-red-500">*</span></label>
           <div className="relative">
             <input 
                type="time" 
                className={`p-3 rounded-xl border w-full md:w-64 font-bold text-gray-900 focus:outline-none focus:ring-2 ${timeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}`}
                value={pickupTimeInput}
                onChange={(e) => validateTime(e.target.value)}
             />
             {previousArrivalTime && !timeError && (
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded select-none pointer-events-none">+30m buffer</div>
             )}
           </div>
           {timeError && (
              <div className="text-red-500 text-sm font-bold mt-2 flex items-center">
                 <AlertCircle className="w-4 h-4 mr-1" />
                 {timeError}
              </div>
           )}
        </div>

        <div className={`space-y-4 ${isBookedExternally ? 'opacity-50 pointer-events-none grayscale transition-all' : ''}`}>
           {sortedCabs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Car className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500 font-medium">{t('noAvailable', { mode: t('cab') })}</p>
                <p className="text-sm text-gray-400 mt-2">{t('offlineDesc')}</p>
              </div>
           ) : (
             <>
                 <h2 className="text-2xl font-black text-gray-900 mb-6">{t('available', { mode: t('cab') })}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {sortedCabs.map((cab, idx) => {
                        const isSelected = searchState.selectedCab === cab
                        const basePrice = cab.price || 800

                        return (
                          <div 
                             key={idx} 
                             className={`group bg-white rounded-3xl overflow-hidden border ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl' : 'border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-lg'} transition-all cursor-pointer flex flex-col`}
                             onClick={() => searchState.setSearch({ selectedCab: cab })}
                          >
                             <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                   <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                      <Car className="w-6 h-6" />
                                   </div>
                                   <div className="text-right">
                                      <div className="text-xl font-black text-gray-900">{tPrice(cab.price)}</div>
                                      <div className="text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full inline-block mt-1">{cab.type || 'Sedan'}</div>
                                   </div>
                                </div>
                                <div className="font-bold text-gray-700 flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {cab.duration || '40m'} estimated
                                </div>
                                <div className="text-sm text-gray-500 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                                   <span className="font-semibold text-gray-700 block mb-1">Trip Details:</span>
                                   {previousDestination} → Final Destination
                                </div>
                             </div>
                             
                             <div className={`p-4 font-black flex items-center justify-center transition-colors border-t
                                ${isSelected ? 'bg-indigo-600 text-white border-transparent' : 'bg-gray-50 text-indigo-600 border-gray-100 group-hover:bg-indigo-50'}
                             `}>
                               {isSelected ? 'Selected ✓' : 'Select Cab'}
                             </div>
                          </div>
                        )
                     })}
                 </div>
             </>
           )}
        </div>

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] py-4 z-50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div>
             {isBookedExternally ? (
               <div className="font-bold text-gray-900 flex items-center gap-2">
                 <CheckCircle className="text-green-500 w-5 h-5"/> {t('skippingStep', { mode: t('cab') })}
               </div>
             ) : searchState.selectedCab ? (
               <div>
                  <span className="text-gray-500 font-semibold text-sm">{t('selectedRouteLabel')}</span>
                  <div className="font-black text-gray-900 text-lg flex items-center gap-2">
                     {searchState.selectedCab.type || 'Sedan'} • {tPrice(searchState.selectedCab.price || 0)}
                  </div>
               </div>
             ) : (
               <div className="text-gray-500 font-semibold text-sm">{t('pleaseSelect', { mode: t('cab') })}</div>
             )}
           </div>
           
           <button 
             onClick={handleFinalize}
             disabled={!!timeError || !pickupTimeInput || (!isBookedExternally && !searchState.selectedCab)}
             className="flex items-center px-8 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
           >
             {t('continueTo', { mode: getNextMode() ? t(getNextMode() as any) : t('summary') })} 
             <ArrowRight className="w-5 h-5 ml-2" />
           </button>
        </div>
      </div>
    </div>
  )
}
