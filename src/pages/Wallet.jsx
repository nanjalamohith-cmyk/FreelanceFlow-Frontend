import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Wallet as WalletIcon,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  Coins,
  History,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(true);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      setWallet(res.data);
    } catch (err) {
      console.warn('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setError('');
    setSuccess('');
    setFundingLoading(true);

    try {
      const res = await api.post('/wallet/add-funds', { amount: Number(amount) });
      setWallet(res.data);
      setSuccess(`Successfully added $${Number(amount).toFixed(2)} to your wallet!`);
      setShowAddModal(false);
      refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add funds');
    } finally {
      setFundingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Escrow Wallet & Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your platform balance and inspect immutable double-entry escrow transactions
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Balance Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Available Escrow Balance
            </span>
            <div className="text-3xl sm:text-5xl font-black tracking-tight">
              ${Number(wallet.balance || user?.walletBalance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">
              Funds are held safely and allocated to milestones on contract creation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Funds (Top-Up)
            </button>
            <button
              onClick={fetchWallet}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="Refresh ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Transaction Ledger</h2>
          </div>
          <span className="text-xs text-slate-400">
            {wallet.transactions?.length || 0} Transactions
          </span>
        </div>

        {wallet.transactions?.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No transactions recorded yet. Top up your balance to start funding milestones.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {wallet.transactions.map((tx) => {
              const isPositive = tx.type === 'DEPOSIT' || tx.type === 'RELEASE' || tx.type === 'REFUND';
              return (
                <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' :
                      tx.type === 'RELEASE' ? 'bg-indigo-50 text-indigo-600' :
                      tx.type === 'REFUND' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700' :
                          tx.type === 'RELEASE' ? 'bg-indigo-50 text-indigo-700' :
                          tx.type === 'REFUND' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                        {tx.contractId && (
                          <span className="text-[11px] text-slate-400">
                            Contract #{tx.contractId.slice(-6)}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isPositive ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Balance: ${Number(tx.balanceAfter || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>Simulated Top-Up</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Top-Up Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm">$</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['100', '250', '500', '1000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                  >
                    +${val}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fundingLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {fundingLoading ? 'Processing...' : 'Deposit Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
