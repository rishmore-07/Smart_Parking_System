import React, { useEffect, useState } from 'react';
import { vehicleService } from '../services/vehicleService';
import type { VehicleCreateInput } from '../services/vehicleService';
import type { Vehicle, VehicleType } from '../types';
import { 
  Car, 
  Plus, 
  Pencil,
  Trash2, 
  Star, 
  Zap, 
  Bike, 
  Truck, 
  AlertCircle, 
  CheckCircle2,
  X
} from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [formData, setFormData] = useState<VehicleCreateInput>({
    license_plate: '',
    make: '',
    model: '',
    color: '',
    vehicle_type: 'car',
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await vehicleService.list();
      if (res.success && res.data) {
        setVehicles(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      license_plate: '',
      make: '',
      model: '',
      color: '',
      vehicle_type: 'car',
      is_default: vehicles.length === 0,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color || '',
      vehicle_type: vehicle.vehicle_type,
      is_default: vehicle.is_default,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.license_plate.trim() || !formData.make.trim() || !formData.model.trim()) {
      setFormError('Please fill in license plate, make, and model.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingVehicle) {
        // Update vehicle
        const res = await vehicleService.update(editingVehicle.id, {
          license_plate: formData.license_plate.toUpperCase().trim(),
          make: formData.make.trim(),
          model: formData.model.trim(),
          color: formData.color?.trim() || undefined,
          vehicle_type: formData.vehicle_type,
          is_default: formData.is_default,
        });
        if (res.success) {
          closeModal();
          setNotification({ type: 'success', text: `Vehicle ${res.data.license_plate} updated successfully.` });
          await fetchVehicles();
        } else {
          setFormError(res.message || 'Could not update vehicle');
        }
      } else {
        // Create vehicle
        const res = await vehicleService.create({
          license_plate: formData.license_plate.toUpperCase().trim(),
          make: formData.make.trim(),
          model: formData.model.trim(),
          color: formData.color?.trim() || undefined,
          vehicle_type: formData.vehicle_type,
          is_default: formData.is_default,
        });
        if (res.success) {
          closeModal();
          setNotification({ type: 'success', text: `Vehicle ${res.data.license_plate} registered successfully.` });
          await fetchVehicles();
        } else {
          setFormError(res.message || 'Could not save vehicle');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Error processing vehicle request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await vehicleService.setDefault(id);
      setNotification({ type: 'success', text: 'Default vehicle updated.' });
      await fetchVehicles();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to update default vehicle' });
    }
  };

  const handleDelete = async (id: number, plate: string) => {
    if (!window.confirm(`Are you sure you want to remove vehicle ${plate}?`)) return;
    try {
      await vehicleService.delete(id);
      setNotification({ type: 'success', text: `Vehicle ${plate} removed from your garage.` });
      await fetchVehicles();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete vehicle' });
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'ev':
        return <Zap className="w-5 h-5 text-emerald-600" />;
      case 'bike':
        return <Bike className="w-5 h-5 text-amber-600" />;
      case 'truck':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'suv':
        return <Car className="w-5 h-5 text-indigo-600" />;
      default:
        return <Car className="w-5 h-5 text-[#0F766E]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Vehicle Garage
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Manage your registered vehicles for instantaneous spot bookings and automated rate calculation.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-medium hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900 mb-1">No vehicles registered yet</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Add your primary vehicle to enable 1-click spot reservations and license plate entry recognition.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold shadow-xs transition-all inline-flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Vehicle</span>
          </button>
        </div>
      ) : (
        /* Vehicle Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`relative bg-white rounded-2xl border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                v.is_default ? 'border-[#0F766E] ring-1 ring-[#0F766E]/20' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    {getVehicleIcon(v.vehicle_type)}
                  </div>
                  {v.is_default ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <Star className="w-3 h-3 fill-emerald-600" />
                      <span>Default</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(v.id)}
                      className="text-xs text-slate-400 hover:text-[#0F766E] transition-colors font-medium cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {v.make}
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
                    {v.model}
                  </h3>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 tracking-wider">
                      {v.license_plate}
                    </span>
                    {v.color && (
                      <span className="text-xs text-slate-500 font-medium">
                        • {v.color}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                  {v.vehicle_type.toUpperCase()}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(v)}
                    title="Edit vehicle details"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F766E] hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.license_plate)}
                    title="Remove vehicle"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  {editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  License Plate Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-02-AB-1234"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  className="block w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Manufacturer / Make *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ioniq 5"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as VehicleType })}
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  >
                    <option value="car">Car (Standard)</option>
                    <option value="suv">SUV / Crossover</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="bike">Motorcycle / Bike</option>
                    <option value="truck">Light Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Colour (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Matte Gold"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                />
                <label htmlFor="is_default" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Set as primary/default vehicle for reservations
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
