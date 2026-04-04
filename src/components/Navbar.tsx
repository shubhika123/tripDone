'use client'

import { Globe, Heart, User, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [lang] = useState('EN');
  const [currency] = useState('USD');

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <Link href="/" className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transform hover:scale-105 transition-transform origin-left">
        TripDone
      </Link>
      
      <div className="flex items-center space-x-6 text-sm font-semibold text-gray-700">
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
            <Globe className="w-4 h-4 text-gray-500" />
            <span>{lang}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          
          <button className="flex items-center space-x-1 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
            <span>{currency}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>

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
