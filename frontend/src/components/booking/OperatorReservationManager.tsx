import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationService } from '../../services/reservationService';
import type { Reservation, ReservationStatus } from '../../types/reservation';
import { Filter } from 'lucide-react';

interface OperatorReservationManagerProps {
  isAdmin?: boolean;
}

export const OperatorReservationManager: React.FC<OperatorReservationManagerProps> = ({ isAdmin = false }) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: resData, isLoading, isError } = useQuery({
    queryKey: ['operator-reservations', isAdmin, statusFilter],
    queryFn: () => {
      const params = statusFilter ? { status: statusFilter } : undefined;
      return isAdmin
        ? reservationService.getAdminReservations(params)
        : reservationService.getOperatorReservations(params);
    },
  });

  const reservations: Reservation[] = resData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return reservationService.updateOperatorStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-reservations'] });
    },
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Active</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      case 'NO_SHOW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">No Show</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
              {isAdmin ? 'Admin Console' : 'Facility Operator Hub'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Phase 4 Management</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            {isAdmin ? 'Platform Reservation Audits' : 'Facility Bookings & Check-in Control'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Global real-time visibility across all parking reservations and facilities.'
              : 'Live reservations for parking facilities under your operator ownership.'}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 font-medium focus:ring-2 focus:ring-[#0F766E]/20"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active Session</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_SHOW">No Show</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading facility reservations...</div>
      ) : isError ? (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl">Could not load reservations.</div>
      ) : reservations.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
          No bookings match the selected status filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-100">
              <tr>
                <th className="py-3 px-3 font-semibold">Reference</th>
                <th className="py-3 px-3 font-semibold">Facility</th>
                <th className="py-3 px-3 font-semibold">Bay / Spot</th>
                <th className="py-3 px-3 font-semibold">Vehicle</th>
                <th className="py-3 px-3 font-semibold">Time Window</th>
                <th className="py-3 px-3 font-semibold">Fee</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reservations.map((r) => {
                const startDate = new Date(r.start_time);
                const endDate = new Date(r.end_time);
                const canMarkComplete = r.status === 'CONFIRMED' || r.status === 'ACTIVE';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.booking_code}</td>
                    <td className="py-3 px-3 font-semibold max-w-[140px] truncate">{r.facility?.name}</td>
                    <td className="py-3 px-3 font-bold text-teal-800">
                      {r.spot?.spot_number ? `Bay ${r.spot.spot_number}` : 'Standard Bay'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{r.vehicle?.license_plate}</div>
                      <div className="text-[10px] text-slate-400">{r.vehicle?.model}</div>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <div>{startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div className="text-slate-400">
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#0F766E]">₹{r.total_amount}</td>
                    <td className="py-3 px-3">{getStatusBadge(r.status)}</td>
                    <td className="py-3 px-3 text-right">
                      {canMarkComplete && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate({ id: r.id, status: 'COMPLETED' })
                            }
                            title="Mark Completed"
                            className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            disabled={updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate({ id: r.id, status: 'NO_SHOW' })
                            }
                            title="Mark No-Show"
                            className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold hover:bg-amber-200 transition-colors disabled:opacity-50"
                          >
                            No Show
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
