import React from 'react';
import { Car, Shield, Cpu, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white">
                <Car className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-slate-900 tracking-tight">Smart Parking Finder</span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm mb-4 leading-relaxed">
              An intelligent parking assistant for modern smart cities. Real-time availability simulation,
              AI predictive recommendations, seamless digital reservations, and smart vehicle retrieval.
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Simulated IoT Core</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Enterprise RBAC</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>AI Forecasting</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">System Roles</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Guest Search & Discovery</li>
              <li>Registered Driver Garage</li>
              <li>Parking Facility Operator</li>
              <li>Smart City Administrator</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Phase 1 Foundation</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>FastAPI + PostgreSQL Schema</li>
              <li>JWT & Security Architecture</li>
              <li>Vehicle Profiles Management</li>
              <li>Standardized JSON Response API</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Smart Parking Finder. Software Engineering Project.</p>
          <p className="mt-2 sm:mt-0 font-medium">Phase 1 Architecture Complete • v1.0.0</p>
        </div>
      </div>
    </footer>
  );
};
