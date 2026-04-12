'use client'

import { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Loader2,
  X,
  ChevronRight,
  History,
  Camera
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

interface TripImage {
  id: string;
  image_url: string;
  created_at: string;
}

interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  total_cost: number;
  status: string;
  trip_images: TripImage[];
}

export default function MyTripsPage() {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTripId, setUploadingTripId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/trips?user_id=guest-user');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleFileUpload = async (tripId: string, file: File) => {
    setUploadingTripId(tripId);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', 'guest-user');

    try {
      const res = await fetch(`http://localhost:8000/api/trips/${tripId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        fetchTrips(); // Refresh trips to show new image
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingTripId(null);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/trips/images/${imageId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTrips();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center space-x-3 text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">
            <History className="w-4 h-4" />
            <span>Journal</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-2">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Trips</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Keep track of your journeys and preserve the memories with photos from every destination.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {trips.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No trips saved yet</h3>
            <p className="text-gray-500 mb-8">Start planning your next adventure to see it here!</p>
            <Link href="/" className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
              <span>Plan a Trip</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {trips.map((trip) => (
              <div key={trip.id} className="group">
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:shadow-blue-200/20">
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 text-2xl font-black text-gray-900">
                            <span>{trip.from_city}</span>
                            <ChevronRight className="w-6 h-6 text-gray-300" />
                            <span>{trip.to_city}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="flex items-center text-gray-400 text-sm font-medium">
                              <Calendar className="w-4 h-4 mr-1.5" />
                              {trip.travel_date}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                            <span className="text-blue-600 text-sm font-bold uppercase tracking-wider">
                              {trip.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <label className={`
                          flex items-center space-x-2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-bold cursor-pointer hover:bg-black transition-all shadow-lg active:scale-95
                          ${uploadingTripId === trip.id ? 'opacity-50 pointer-events-none' : ''}
                        `}>
                          {uploadingTripId === trip.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                          <span>Add Memory</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(trip.id, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Image Gallery */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {trip.trip_images?.length > 0 ? (
                        trip.trip_images.map((img) => (
                          <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden group/img cursor-pointer bg-gray-50 border border-gray-100">
                            <img 
                              src={img.image_url} 
                              alt="Trip Memory" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                              onClick={() => setSelectedImage(img.image_url)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteImage(img.id);
                                }}
                                className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors transform hover:scale-110"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-400 font-medium">No photos yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <X className="w-10 h-10" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full Preview" 
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
