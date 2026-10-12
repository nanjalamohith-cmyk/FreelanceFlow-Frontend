import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  ShieldCheck,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Coins
} from 'lucide-react';

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await api.get('/contracts');
        setContracts(res.data);
      } catch (err) {
        console.warn('Could not load contracts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Escrow Contracts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Milestone tracking, deliverable verification, live chat, and escrow payouts
        </p>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active contracts yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {user.role === 'CLIENT'
              ? 'Accept a proposal on one of your jobs to create an escrow contract with milestones.'
              : 'Submit proposals on open jobs to secure contracts.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => {
            const totalMilestones = contract.milestones?.length || 0;
            const releasedMilestones = contract.milestones?.filter((m) => m.status === 'RELEASED').length || 0;
            const progress = totalMilestones > 0 ? (releasedMilestones / totalMilestones) * 100 : 0;

            return (
              <div
                key={contract.id}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      contract.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      contract.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      contract.status === 'DISPUTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {contract.status}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Contract #{contract.id.slice(-6)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">
                      {contract.jobTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {user.id === contract.clientId ? `Freelancer: ${contract.freelancerName}` : `Client: ${contract.clientName}`}
                    </p>
                  </div>

                  {/* Milestone Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Milestones Completed</span>
                      <span>{releasedMilestones} / {totalMilestones}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Value</span>
                    <span className="text-lg font-black text-slate-900">
                      ${Number(contract.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  <Link
                    to={`/contracts/${contract.id}`}
                    className="px-4 py-2 bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
