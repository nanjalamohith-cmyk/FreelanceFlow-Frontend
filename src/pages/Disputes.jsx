import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText
} from 'lucide-react';

export default function Disputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        let res;
        if (user.role === 'ADMIN') {
          res = await api.get('/admin/disputes');
        } else {
          // fetch contracts and collect disputes
          const contractsRes = await api.get('/contracts');
          const allDisputes = [];
          for (const c of contractsRes.data) {
            try {
              const dRes = await api.get(`/contracts/${c.id}/disputes`);
              allDisputes.push(...dRes.data);
            } catch (e) {
              // non-fatal
            }
          }
          res = { data: allDisputes };
        }
        setDisputes(res.data);
      } catch (err) {
        console.warn('Could not load disputes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dispute Resolution Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review contested milestone funds and administrator arbitration outcomes
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No disputes on file</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All milestones are proceeding smoothly. If disagreements occur on deliverables, either party can raise a dispute directly on the contract page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    d.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {d.status}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Milestone: {d.milestoneTitle || d.milestoneId}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {d.milestoneAmount && (
                    <span className="text-sm font-extrabold text-slate-900">
                      Disputed: ${Number(d.milestoneAmount).toFixed(2)}
                    </span>
                  )}
                  <Link
                    to={`/contracts/${d.contractId}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>View Contract</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">
                  Dispute Reason (Raised by {d.raisedByName || 'Participant'}):
                </span>
                <p className="leading-relaxed">{d.reason}</p>
              </div>

              {d.status === 'RESOLVED' && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Administrator Resolution: {d.resolution?.replace(/_/g, ' ')}</span>
                    {d.resolution === 'SPLIT' && (
                      <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px]">
                        {d.splitPercentToFreelancer}% Freelancer / {100 - (d.splitPercentToFreelancer || 50)}% Client
                      </span>
                    )}
                  </div>
                  {d.adminNote && (
                    <p className="text-emerald-800 text-xs pl-6">
                      Note: {d.adminNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
