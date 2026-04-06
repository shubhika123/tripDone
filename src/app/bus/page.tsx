'use client'

import { useSearchStore } from '@/store/useSearchStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Bus, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Star, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function BusPage() {
  const router = useRouter()
  const searchState = useSearchStore()
  
  const [expandedBus, setExpandedBus] = useState<number | null>(null)
  const [isBookedExternally, setIsBookedExternally] = useState(false)

  useEffect(() => {
    if (!searchState.from || !searchState.to || !searchState.selectedModes.includes('bus')) {
      router.replace('/')
    }
  }, [searchState, router])

  const buses = searchState.buses?.length ? searchState.buses : searchState.taxi || []
  
  // Previous Arrival Time logic 
  let previousArrivalTime: string | null = null;
  const busModeIndex = searchState.selectedModes.indexOf('bus')
  if (busModeIndex > 0) {
    const prevMode = searchState.selectedModes[busModeIndex - 1];
    if (prevMode === 'train' && searchState.selectedTrain) {
        previousArrivalTime = searchState.selectedTrain.arrivalTime;
    } else if (prevMode === 'flight' && searchState.selectedFlight) {
        previousArrivalTime = searchState.selectedFlight.arrivalTime;
    }
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

  const filteredBuses = buses.filter((b: any) => {
      if (!previousArrivalTime || !b.departureTime) return true;
      const prevArr = parseTime(previousArrivalTime);
      const curDep = parseTime(b.departureTime);
      return curDep >= prevArr;
  })

  const sortedBuses = [...filteredBuses].sort((a, b) => {
    const pA = a.price || Infinity;
    const pB = b.price || Infinity;
    const tA = parseTime(a.duration) || Infinity;
    const tB = parseTime(b.duration) || Infinity;
    
    if (pA === pB) return tA - tB;
    return pA - pB;
  })

  const topBuses = sortedBuses.slice(0, 3);
  const otherBuses = sortedBuses.slice(3);

  const getNextMode = () => {
    const currentIndex = searchState.selectedModes.indexOf('bus')
    return searchState.selectedModes[currentIndex + 1] || null
  }

  const handleFinalize = () => {
    if (isBookedExternally) {
      searchState.setSearch({
        skippedModes: [...(searchState.skippedModes || []), 'bus'],
        completedSteps: [...(searchState.completedSteps || []), 'bus']
      })
    } else {
      searchState.setSearch({
        completedSteps: [...(searchState.completedSteps || []), 'bus']
      })
    }

    const next = getNextMode()
    if (next) {
      router.push(`/${next.toLowerCase()}`)
    } else {
      router.push('/summary')
    }
  }

  const platforms = ['RedBus', 'AbhiBus', 'MakeMyTrip']

  if (!searchState.selectedModes.includes('bus')) {
    return null;
  }

  const renderBusCard = (bus: any, idx: number, isTopBus: boolean = false) => {
    const isSelected = searchState.selectedBus === bus;
    const isExpanded = expandedBus === idx;
    
    const basePrice = bus.price || 1200;

    return (
      <div key={idx} className={`bg-white rounded-3xl overflow-hidden border ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg' : 'border-gray-200 shadow-sm'} transition-all`}>
        <div className="p-6 cursor-pointer" onClick={() => {
            if (!isExpanded) {
                // If not expanded, select the bus logic
                searchState.setSearch({ selectedBus: bus, selectedBusPlatform: null })
            }
            setExpandedBus(isExpanded ? null : idx)
        }}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center font-bold text-orange-600 shrink-0">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                   {bus.operator || 'National Travels'} 
                   <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase tracking-wider">{bus.type || 'AC Sleeper'}</span>
                </h3>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700">{bus.departureTime || '22:00'}</span>
                      <span className="text-xs">{bus.boardingPoint || searchState.from}</span>
                    </div>
                    <span className="text-gray-300 mx-1">→</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700">{bus.arrivalTime || '06:00'}</span>
                      <span className="text-xs">{bus.droppingPoint || searchState.to}</span>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="text-center px-4 self-center hidden sm:flex items-center flex-col">
              <div className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-full flex items-center"><Clock className="w-3 h-3 mr-1"/> {bus.duration || '8h 00m'}</div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="text-2xl font-black text-gray-900">₹{basePrice.toLocaleString()}</div>
              
              <button className={`text-sm font-bold flex items-center mt-2 group ${isSelected ? 'text-orange-600' : 'text-blue-600'}`}>
                {isSelected ? (isExpanded ? 'Change Platform' : 'Selected') : 'Select Bus'} 
                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/80 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
             <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wider">Choose Booking Platform</h4>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 {platforms.map(platform => {
                     const isPlatformSelected = isSelected && searchState.selectedBusPlatform === platform
                     return (
                         <button 
                         key={platform}
                         onClick={(e) => {
                             e.stopPropagation();
                             searchState.setSearch({ selectedBus: bus, selectedBusPlatform: platform })
                         }}
                         className={`p-4 rounded-xl flex items-center justify-between border transition-all cursor-pointer ${isPlatformSelected ? 'bg-orange-50 border-orange-500 text-orange-900 ring-1 ring-orange-500 shadow-sm' : 'bg-white border-gray-200 text-gray-900 hover:border-orange-300'}`}
                         >
                         <span className="font-bold">{platform}</span>
                         <span className="font-black">₹{basePrice.toLocaleString()}</span>
                         </button>
                     )
                 })}
             </div>
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
              <Bus className="w-5 h-5 mr-2 text-orange-600" />
              Departure Booking: Bus
            </h1>
            {previousArrivalTime && (
              <p className="text-sm font-medium text-gray-500 mt-1">
                 Showing buses after {previousArrivalTime} (previous mode arrival)
              </p>
            )}
          </div>
          <div className="flex space-x-2 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {searchState.selectedModes.map((m, i) => {
              const isCompleted = (searchState.completedSteps || []).includes(m)
              return (
                <div key={i} className={`flex items-center shrink-0 ${m === 'bus' ? 'text-orange-600' : isCompleted ? 'text-green-500' : ''}`}>
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
          <h2 className="text-2xl font-black text-gray-900">Available Buses</h2>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-200 rounded-full shadow-sm hover:border-orange-300 transition-colors">
              <input 
                type="checkbox" 
                id="external"
                className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                checked={isBookedExternally}
                onChange={(e) => setIsBookedExternally(e.target.checked)}
              />
              <label htmlFor="external" className="text-sm font-bold text-gray-700 cursor-pointer">✓ Already booked externally</label>
          </div>
        </div>

        <div className={`space-y-10 ${isBookedExternally ? 'opacity-50 pointer-events-none grayscale transition-all' : ''}`}>
           {sortedBuses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Bus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500 font-medium">No bus data available for this route.</p>
                <p className="text-sm text-gray-400 mt-2">Try skipping this step if booked externally.</p>
              </div>
           ) : (
              <>
                 {topBuses.length > 0 && (
                   <section>
                      <div className="flex items-center gap-2 mb-4">
                         <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                         <h3 className="text-lg font-black text-gray-900">Recommended Buses</h3>
                         <span className="text-sm font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md ml-auto sm:ml-0">Best Price & Duration</span>
                      </div>
                      <div className="space-y-4">
                         {topBuses.map((bus, idx) => renderBusCard(bus, idx, true))}
                      </div>
                   </section>
                 )}

                 {otherBuses.length > 0 && (
                   <section>
                      <h3 className="text-lg font-black text-gray-900 mb-4">Other Buses</h3>
                      <div className="space-y-4">
                         {otherBuses.map((bus, idx) => renderBusCard(bus, idx + topBuses.length, false))}
                      </div>
                   </section>
                 )}
              </>
           )}
        </div>

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] py-4 z-50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div>
             {isBookedExternally ? (
               <div className="font-bold text-gray-900 flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5"/> Skipping Bus Step</div>
             ) : searchState.selectedBus && searchState.selectedBusPlatform ? (
               <div>
                  <span className="text-gray-500 font-semibold text-sm">Selected Route:</span>
                  <div className="font-black text-gray-900 text-lg flex items-center gap-2">
                     {searchState.selectedBus.operator || 'National Travels'} • {searchState.selectedBusPlatform}
                  </div>
               </div>
             ) : (
               <div className="text-gray-500 font-semibold text-sm">Please select a bus & platform...</div>
             )}
           </div>
           
           <button 
             onClick={handleFinalize}
             disabled={!isBookedExternally && (!searchState.selectedBus || !searchState.selectedBusPlatform)}
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
