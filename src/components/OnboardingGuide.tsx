'use client';

import { useEffect, useState } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export default function OnboardingGuide() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if onboarding is completed
    const hasCompleted = localStorage.getItem('tour-completed');
    if (hasCompleted) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-2xl bg-white rounded-2xl font-sans !border-none',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true
        }
      }
    });

    tour.addStep({
      id: 'step-1',
      title: 'Enter your route',
      text: 'Start your journey by defining the locations. We support any city worldwide.',
      attachTo: { element: '#tour-inputs', on: 'bottom' },
      buttons: [
        { text: 'Skip', action: tour.cancel, classes: 'text-gray-500 hover:text-gray-900 border-none font-bold mr-4 outline-none' },
        { text: 'Next', action: tour.next, classes: 'bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-700 outline-none' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Compare routes',
      text: 'With just one click, explore seamlessly stitched itineraries mapping flights, trains, and cabs on a single canvas.',
      attachTo: { element: '#tour-search', on: 'top' },
      buttons: [
        { text: 'Skip', action: tour.cancel, classes: 'text-gray-500 hover:text-gray-900 border-none font-bold mr-4 outline-none' },
        { text: 'Next', action: tour.next, classes: 'bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-700 outline-none' }
      ]
    });

    tour.addStep({
      id: 'step-3',
      title: 'Resume past searches',
      text: 'One-click restore past itineraries. You will never lose your trip parameters.',
      attachTo: { element: '#tour-recent', on: 'top' },
      buttons: [
        { text: 'Finish', action: tour.next, classes: 'bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-700 outline-none' }
      ]
    });

    tour.on('complete', () => {
      localStorage.setItem('tour-completed', 'true');
    });

    tour.on('cancel', () => {
      localStorage.setItem('tour-completed', 'true');
    });

    // Slight delay ensures the DOM completely settles
    setTimeout(() => {
      tour.start();
    }, 800);

    return () => {
      tour.cancel();
    }
  }, [mounted]);

  return null;
}
