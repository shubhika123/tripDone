'use client'

import { useState, useEffect } from 'react';
import { useSearchStore } from '@/store/useSearchStore';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ArrowRightLeft, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

import { useTranslation } from '@/hooks/useTranslation';

export default function SearchBox() {
  const { t, hasHydrated } = useTranslation();
  const router = useRouter();
  const searchState = useSearchStore();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [swapRot, setSwapRot] = useState(0);
  const [depOpen, setDepOpen] = useState(false);
  const [retOpen, setRetOpen] = useState(false);

  // Initialize loading message correctly once hydrated
  useEffect(() => {
    if (hasHydrated) {
      setLoadingMsg(t('search'));
    }
  }, [hasHydrated, t]);

  if (!hasHydrated) return <div className="w-full max-w-4xl mx-auto h-[400px] bg-white/50 animate-pulse rounded-[2rem] mt-4" />;

  const handleDepSelect = (date: Date | undefined) => {
    if (date) {
      searchState.setSearch({ departureDate: format(date, 'yyyy-MM-dd') });
      setDepOpen(false);
    }
  };

  const handleRetSelect = (date: Date | undefined) => {
    if (date) {
      searchState.setSearch({ returnDate: format(date, 'yyyy-MM-dd') });
      setRetOpen(false);
    }
  };

  const handleSwap = () => {
    setSwapRot((prev) => prev + 180);
    searchState.setSearch({
      from: searchState.to,
      to: searchState.from,
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchState.from || !searchState.to) {
      alert("Please enter a departure and destination.");
      return;
    }
    setLoading(true);
    setLoadingMsg(t('loading'));
    try {
      // Primary: use Next.js API route (server-side proxy, no CORS issues)
      // Fallback: direct backend call (requires CORS)
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tripdone-crl1.onrender.com';
      let res: Response | null = null;
      let isError = false;

      const searchBody = JSON.stringify({
        from_city: searchState.from,
        to_city: searchState.to,
        date: searchState.departureDate,
        modes: ['flight', 'train', 'bus', 'cab'],
        adults: searchState.adults || 1
      });

      // Retry up to 3 times with delay between attempts (Render free tier cold start)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt === 1) setLoadingMsg(t('wakingServer'));
          else setLoadingMsg(`${t('retryLive')} ${attempt}/3...`);
          
          // Try server-side proxy first (no CORS), then direct
          const apiUrl = attempt <= 2 ? '/api/search' : `${BACKEND}/api/search`;
          res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: searchBody,
            signal: AbortSignal.timeout(25000), // 25s per attempt
          });
          if (res.ok) break; 
        } catch (err) {
          console.warn(`Attempt ${attempt} failed:`, err);
          if (attempt === 3) isError = true;
          else await new Promise(r => setTimeout(r, 4000)); // slightly longer delay for cold starts
        }
      }

      setLoadingMsg(t('processing'));
      
      if (!res || !res.ok || isError) {
        console.warn('API failed after retries. Using local fallback data.');
        const { FALLBACK_DATA } = await import('@/lib/mockData');
        searchState.setSearch({
            ...FALLBACK_DATA,
            isFallback: true
        });
      } else {
        const data = await res.json();
        const mappedRoutes = (data.routes || []).map((r: any) => ({
            ...r,
            totalPrice: r.total_cost || r.totalPrice || r.price,
            totalDuration: r.duration || r.totalDuration,
            legs: (r.legs || []).map((leg: any) => ({
                ...leg,
                origin: leg.from || leg.origin,
                destination: leg.to || leg.destination,
                departureTime: leg.dep || leg.departureTime,
                arrivalTime: leg.arr || leg.arrivalTime,
            }))
        }));
        searchState.setSearch({
            routes: mappedRoutes,
            flights: data.flights || [],
            trains: data.trains || [],
            taxi: data.taxi || [],
            buses: data.buses || [],
            isFallback: false
        });
      }
      router.push('/routes');
    } catch (err) {
      console.error('Fatal Search Error:', err);
      // Even in fatal error, try to show fallback to keep the demo running smoothly
      try {
        const { FALLBACK_DATA } = await import('@/lib/mockData');
        searchState.setSearch({ ...FALLBACK_DATA, isFallback: true });
        router.push('/routes');
      } catch {
        router.push('/');
      }
    } finally {
      setLoading(false);
      setLoadingMsg(t('loading'));
    }
  };


  const renderDate = (dateStr: string | null, placeholder: string) => {
    if (!dateStr) return <span className="text-gray-400">{placeholder}</span>;
    try {
      return <span className="font-bold text-gray-900">{format(parseISO(dateStr), 'EEE, d MMM')}</span>;
    } catch {
      return <span className="font-bold text-gray-900">{dateStr}</span>;
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden mt-4 border border-white/80 ring-1 ring-gray-900/5">
      <div className="flex bg-gray-50/80 p-2 space-x-2 border-b border-gray-100">
        <button 
          type="button"
          onClick={() => searchState.setSearch({ tripType: 'one-way' })}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${searchState.tripType === 'one-way' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          {t('oneWay')}
        </button>
        <button 
          type="button"
          onClick={() => searchState.setSearch({ tripType: 'round-trip' })}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${searchState.tripType === 'round-trip' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          {t('roundTrip')}
        </button>
      </div>
      
      <div className="p-8">
        <div id="tour-inputs" className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder={t('from')} 
              value={searchState.from}
              onChange={(e) => searchState.setSearch({ from: e.target.value })}
              className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-xl text-gray-900"
            />
          </div>
          
          <button 
            type="button"
            onClick={handleSwap}
            style={{ transform: `translateX(-50%) translateY(-50%) rotate(${swapRot}deg)` }}
            className="md:flex absolute left-1/2 top-1/2 z-10 w-12 h-12 bg-white border border-gray-200/80 rounded-full items-center justify-center shadow-lg text-gray-400 hover:text-blue-600 cursor-pointer transition-all duration-500 outline-none focus:ring-4 focus:ring-blue-100 hidden"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder={t('to')} 
              value={searchState.to}
              onChange={(e) => searchState.setSearch({ to: e.target.value })}
              className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-xl text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Popover open={depOpen} onOpenChange={setDepOpen}>
            <PopoverTrigger className="relative group w-full border border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden flex items-center text-left cursor-pointer outline-none block">
              <div className="pl-4 flex items-center pointer-events-none z-10">
                <Calendar className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="pl-3 pr-4 py-4 flex items-center flex-1 z-0">
                {renderDate(searchState.departureDate, t('departure'))}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={searchState.departureDate ? parseISO(searchState.departureDate) : undefined}
                onSelect={handleDepSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {searchState.tripType === 'round-trip' ? (
            <Popover open={retOpen} onOpenChange={setRetOpen}>
              <PopoverTrigger className="relative group w-full border border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden flex items-center text-left cursor-pointer outline-none block">
                <div className="pl-4 flex items-center pointer-events-none z-10">
                  <Calendar className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="pl-3 pr-4 py-4 flex items-center flex-1 z-0">
                  {renderDate(searchState.returnDate, t('return'))}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={searchState.returnDate ? parseISO(searchState.returnDate) : undefined}
                  onSelect={handleRetSelect}
                  initialFocus
                  disabled={(date: Date) => searchState.departureDate ? date < parseISO(searchState.departureDate) : false}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="relative">
              <button 
                type="button"
                onClick={() => searchState.setSearch({ tripType: 'round-trip' })}
                className="w-full h-full min-h-[58px] border border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gray-50/50 text-gray-500 hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium text-base"
              >
                + {t('addReturn')}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-6 gap-6 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-semibold text-gray-600 mr-2">{t('flexibility')}:</span>
            {['exact', '±1', '±2', '±3'].map(flex => (
              <button
                type="button"
                key={flex}
                onClick={() => searchState.setSearch({ flexibility: flex as 'exact' | '±1' | '±2' | '±3' })}
                className={`text-sm px-4 py-1.5 rounded-full transition-all duration-200 ${searchState.flexibility === flex ? 'bg-blue-100/80 text-blue-700 font-bold shadow-sm ring-1 ring-blue-200' : 'bg-transparent text-gray-500 hover:bg-gray-100 font-medium'}`}
              >
                {flex === 'exact' ? t('exactDates') : `${flex} ${t('days')}`}
              </button>
            ))}
          </div>
          
          <button
            id="tour-search"
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center px-10 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-2xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0 text-lg group disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingMsg}</span>
              </span>
            ) : (
              <>
                <Search className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                {t('compareAndBook')}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
