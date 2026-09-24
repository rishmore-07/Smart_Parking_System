import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mb-6">
        <Car className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404 — Page Not Found</h1>
      <p className="text-slate-600 max-w-md mb-6 text-sm">
        The destination or resource you requested could not be located in the Smart City Mobility Network.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold shadow-xs transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
