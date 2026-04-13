'use client'

import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Train, ChevronDown, ChevronUp, CheckCircle, Lock, ArrowRight, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'

import { useTranslation } from '@/hooks/useTranslation'
import { useCurrency } from '@/hooks/useCurrency'

export default function TrainPage() {
  const { t, hasHydrated: tHydrated } = useTranslation()
  const { tPrice, hasHydrated: cHydrated } = useCurrency()
  const hasHydrated = tHydrated && cHydrated
  const router = useRouter()
  const searchState = useSearchStore()
  
  const [expandedTrain, setExpandedTrain] = useState<number | null>(null)
  const [selectedSeatType, setSelectedSeatType] = useState<string | null>(null)
  
  const [isBookedExternally, setIsBookedExternally] = useState(false)
  const [showProModal, setShowProModal] = useState(false)

  useEffect(() => {
    if (hasHydrated && (!searchState.from || !searchState.to || !searchState.selectedModes.includes('train'))) {
      router.replace('/')
    }
  }, [hasHydrated, searchState, router])

  if (!hasHydrated) return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col items-center justify-center space-y-4 font-sans">
      <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">{t('loading') || 'Searching for trains...'}</p>
    </div>
  );

  const trains = searchState.trains || []
  const isOfflineData = trains.length > 0 && trains[0]?.is_offline === true
  
  // Previous Arrival Time logic 
  let previousArrivalTime: string | null = null;
  const trainModeIndex = searchState.selectedModes.indexOf('train')
  if (trainModeIndex > 0) {
    const prevMode = searchState.selectedModes[trainModeIndex - 1];
    if (prevMode === 'flight' && searchState.selectedFlight) {
        previousArrivalTime = searchState.selectedFlight.arrivalTime;
    }
    // Expand to other previous modes if necessary (e.g. cab, bus)
  }
  
  // Time parsing helper
  const parseTime = (timeStr: string) => {
      try {
          const parts = timeStr.split(':')
          if (parts.length >= 2) {
              const h = parseInt(parts[0], 10)
              const m = parseInt(parts[1], 10)
              return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
          }
      } catch (e) {
          // ignore error
      }
      return 0
  }

  // Filter based on previous arrival time
  const filteredTrains = trains.filter((t) => {
      if (!previousArrivalTime || !t.departureTime) return true;
      const prevArr = parseTime(previousArrivalTime);
      const curDep = parseTime(t.departureTime);
      return curDep >= prevArr;
  })

  // Use real confidence from backend, fallback to random
  const getConfidenceScore = (train: any) => {
     if (train.confidence_score) return train.confidence_score + '%';
     return Math.floor(Math.random() * 30 + 70) + '%';
  }
  const getConfidenceColor = (train: any) => {
     if (train.confidence_color) return train.confidence_color;
     return 'blue';
  }

  const sortedTrains = [...filteredTrains].sort((a, b) => {
    const pA = a.price || Infinity;
    const pB = b.price || Infinity;
    return pA - pB;
  })

  const topTrains = sortedTrains.slice(0, 5);
  const otherTrains = sortedTrains.slice(5);

  const getNextMode = () => {
    const currentIndex = searchState.selectedModes.indexOf('train')
    return searchState.selectedModes[currentIndex + 1] || null
  }

  const handleFinalize = () => {
    if (isBookedExternally) {
      searchState.setSearch({
        skippedModes: [...(searchState.skippedModes || []), 'train'],
        completedSteps: [...(searchState.completedSteps || []), 'train']
      })
    } else {
      searchState.setSearch({
        completedSteps: [...(searchState.completedSteps || []), 'train']
      })
    }

    const next = getNextMode()
    if (next) {
      router.push(`/${next.toLowerCase()}`)
    } else {
      router.push('/summary')
    }
  }

  const seatTypes = [
     { id: '2AC', label: '2AC', multiplier: 2.0 },
     { id: '3AC', label: '3AC', multiplier: 1.5 },
     { id: 'CC', label: 'CC', multiplier: 1.2 }
  ]

  const platforms = ['IRCTC', 'MakeMyTrip', 'Goibibo']

  if (!searchState.selectedModes.includes('train')) {
    return null;
  }

  const renderTrainCard = (train: any, idx: number, isTopTrain: boolean = false) => {
    const isSelected = searchState.selectedTrain === train;
    const isExpanded = expandedTrain === idx;
    
    // Fallback if price is not set
    const basePrice = train.price || 800;

    return (
      <div key={idx} className={`bg-white rounded-3xl overflow-hidden border ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg' : 'border-gray-200 shadow-sm'} transition-all`}>
        <div className="p-6 cursor-pointer" onClick={() => setExpandedTrain(isExpanded ? null : idx)}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600">
                <Train className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                   {train.name || 'Express Train'} 
                   <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{train.trainNumber || '12001'}</span>
                </h3>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">
                    <span className="font-bold text-gray-700">{train.departureTime || '10:00'}</span>
                    <span>{searchState.from || 'Origin'}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-bold text-gray-700">{train.arrivalTime || '14:00'}</span>
                    <span>{searchState.to || 'Dest'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center px-4 self-center hidden sm:block">
              <div className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-full">{train.duration || '4h 00m'}</div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="text-2xl font-black text-gray-900">{tPrice(basePrice)}</div>
              
              {isTopTrain && (
                <div className="mt-1 relative group inline-flex items-center" onClick={(e) => { e.stopPropagation(); setShowProModal(true); }}>
                   <Lock className="w-3 h-3 text-indigo-400 mr-1" />
                   <div className="text-xs font-bold text-indigo-600 blur-[3px] group-hover:blur-0 transition-all select-none border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer">
                     {getConfidenceScore(train)} chance of confirmation
                   </div>
                </div>
              )}

              <button className="text-sm font-bold text-indigo-600 flex items-center mt-2 group">
                {isExpanded ? 'Close Options' : 'Select Seat & Book'} 
                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-6 flex flex-col gap-6">
             <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">1. Select Seat Type</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {seatTypes.map(seat => {
                        const seatPrice = Math.floor(basePrice * seat.multiplier)
                        const isSeatSelected = selectedSeatType === seat.id && isSelected
                        return (
                            <button 
                              key={seat.id}
                              onClick={() => {
                                  setSelectedSeatType(seat.id)
                                  searchState.setSearch({ selectedTrain: train })
                                  setExpandedTrain(idx)
                              }}
                              className={`flex-shrink-0 min-w-[120px] p-4 rounded-2xl flex flex-col items-center justify-center border transition-all ${isSeatSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-300'}`}
                            >
                                <span className="font-black text-lg mb-1">{seat.label}</span>
                                <span className={isSeatSelected ? 'text-indigo-100 font-semibold' : 'text-gray-500 font-semibold'}>{tPrice(seatPrice)}</span>
                            </button>
                        )
                    })}
                </div>
             </div>

             {selectedSeatType && isSelected && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">2. Choose Platform</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {platforms.map(platform => {
                            const isPlatformSelected = isSelected && searchState.selectedTrainPlatform === platform
                            const finalPrice = Math.floor(basePrice * (seatTypes.find(s => s.id === selectedSeatType)?.multiplier || 1))

                            return (
                                <button 
                                key={platform}
                                onClick={() => searchState.setSearch({ selectedTrainPlatform: platform, selectedTrainSeat: selectedSeatType })}
                                className={`p-4 rounded-xl flex items-center justify-between border transition-all ${isPlatformSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 shadow-sm' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-300'}`}
                                >
                                <span className="font-bold">{platform}</span>
                                <span className="font-black">{tPrice(finalPrice)}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
             )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-28 font-sans">
      <Navbar />

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Train className="w-5 h-5 mr-2 text-indigo-600" />
              Departure Booking: Train
            </h1>
            {previousArrivalTime && (
              <p className="text-sm font-medium text-gray-500 mt-1">
                 Showing trains after {previousArrivalTime} (previous mode arrival)
              </p>
            )}
          </div>
          <div className="flex space-x-2 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {searchState.selectedModes.map((m, i) => {
              const isCompleted = (searchState.completedSteps || []).includes(m)
              return (
                <div key={i} className={`flex items-center shrink-0 ${m === 'train' ? 'text-indigo-600' : isCompleted ? 'text-green-500' : ''}`}>
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
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900">Available Trains</h2>
            {isOfflineData && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">⚡ Offline Data</span>
            )}
            {!isOfflineData && trains.length > 0 && (
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">✓ Live IRCTC</span>
            )}
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-200 rounded-full shadow-sm hover:border-indigo-300 transition-colors">
              <input 
                type="checkbox" 
                id="external"
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                checked={isBookedExternally}
                onChange={(e) => setIsBookedExternally(e.target.checked)}
              />
              <label htmlFor="external" className="text-sm font-bold text-gray-700 cursor-pointer">✓ Already booked externally</label>
          </div>
        </div>

        <div className={`space-y-10 ${isBookedExternally ? 'opacity-50 pointer-events-none grayscale transition-all' : ''}`}>
           {sortedTrains.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Train className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500 font-medium">No trains available fitting your schedule.</p>
              </div>
           ) : (
              <>
                 {topTrains.length > 0 && (
                   <section>
                      <div className="flex items-center gap-2 mb-4">
                         <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                         <h3 className="text-lg font-black text-gray-900">Top Priority Trains</h3>
                         <span className="text-sm font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md ml-auto sm:ml-0">Lowest Price & Best Confirmations</span>
                      </div>
                      <div className="space-y-4">
                         {topTrains.map((train, idx) => renderTrainCard(train, idx, true))}
                      </div>
                   </section>
                 )}

                 {otherTrains.length > 0 && (
                   <section>
                      <h3 className="text-lg font-black text-gray-900 mb-4">All Trains</h3>
                      <div className="space-y-4">
                         {otherTrains.map((train, idx) => renderTrainCard(train, idx + topTrains.length, false))}
                      </div>
                   </section>
                 )}
              </>
           )}
        </div>

      </main>

      {showProModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowProModal(false)}>
             <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Unlock Pro</h3>
                <p className="text-center text-gray-600 mb-6 font-medium">Upgrade to Pro to see exact confirmation chances and get AI predictions.</p>
                <div className="space-y-3">
                   <button onClick={() => setShowProModal(false)} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30">Get Pro for {tPrice(99)}/mo</button>
                   <button onClick={() => setShowProModal(false)} className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">Maybe Later</button>
                </div>
             </div>
          </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] py-4 z-50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div>
             {isBookedExternally ? (
               <div className="font-bold text-gray-900 flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5"/> Skipping Train Step</div>
             ) : searchState.selectedTrain && searchState.selectedTrainPlatform && searchState.selectedTrainSeat ? (
               <div>
                  <span className="text-gray-500 font-semibold text-sm">Selected Route:</span>
                  <div className="font-black text-gray-900 text-lg flex items-center gap-2">
                     {searchState.selectedTrain.name || 'Express Train'} • {searchState.selectedTrainSeat} • {searchState.selectedTrainPlatform}
                  </div>
               </div>
             ) : (
               <div className="text-gray-500 font-semibold text-sm">Please select a seat type & platform...</div>
             )}
           </div>
           
           <button 
             onClick={handleFinalize}
             disabled={!isBookedExternally && (!searchState.selectedTrain || !searchState.selectedTrainPlatform || !searchState.selectedTrainSeat)}
             className="flex items-center px-8 py-3.5 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
           >
             Continue to {getNextMode() || 'Summary'} 
             <ArrowRight className="w-5 h-5 ml-2" />
           </button>
        </div>
      </div>
    </div>
  )
}
