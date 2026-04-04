'use client'

import { Globe, Heart, User, ChevronDown, HelpCircle, Play} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const settings = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lang = mounted ? settings.language : 'EN';
  const currency = mounted ? settings.currency : 'USD';

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <Link href="/" className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transform hover:scale-105 transition-transform origin-left">
        TripDone
      </Link>
      
      <div className="flex items-center space-x-6 text-sm font-semibold text-gray-700">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
              <Globe className="w-4 h-4 text-gray-500" />
              <span>{lang}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[120px]">
              <DropdownMenuItem onClick={() => settings.setLanguage('EN')} className={`font-medium cursor-pointer ${lang === 'EN' ? 'bg-blue-50 text-blue-600' : ''}`}>
                English (EN)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => settings.setLanguage('HI')} className={`font-medium cursor-pointer ${lang === 'HI' ? 'bg-blue-50 text-blue-600' : ''}`}>
                Hindi (HI)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[100px]">
              <DropdownMenuItem onClick={() => settings.setCurrency('USD')} className={`font-medium cursor-pointer ${currency === 'USD' ? 'bg-blue-50 text-blue-600' : ''}`}>
                USD ($)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => settings.setCurrency('INR')} className={`font-medium cursor-pointer ${currency === 'INR' ? 'bg-blue-50 text-blue-600' : ''}`}>
                INR (₹)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem('tour-completed');
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            } else {
              window.location.reload();
            }
          }}
          className="flex items-center space-x-2 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors group"
        >
          <Play className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          <span>Watch Demo</span>
        </button>

        <button className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-lg transition-colors group">
          <Heart className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
          <span>My Trips</span>
        </button>
        
        <button className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
}
