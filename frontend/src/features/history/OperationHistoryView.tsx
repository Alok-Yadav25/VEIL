import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Search,
  Filter,
  Trash2,
  Lock,
  Unlock,
  BarChart2,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/feedback/Toast';
import { api, ApiError } from '../../services/api';
import { OperationRecord } from '../../types';

interface OperationHistoryViewProps {
  onNavigate?: (viewId: string) => void;
}

export const OperationHistoryView: React.FC<OperationHistoryViewProps> = ({ onNavigate }) => {
  const { success, error: toastError, info } = useToast();

  const [records, setRecords] = useState<OperationRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 15;

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<OperationRecord | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getHistory({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit,
        offset: page * limit,
      });
      setRecords(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load history', err);
      toastError('Could not retrieve operation history from SQLite database.');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery, page, limit, toastError]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const res = await api.clearHistory();
      success(`Successfully cleared ${res.recordsDeleted} history records from SQLite.`);
      setIsClearModalOpen(false);
      setPage(0);
      fetchHistory();
    } catch (err) {
      toastError('Failed to clear operation history.');
    } finally {
      setIsClearing(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#A78BFA] uppercase tracking-wider">
              ACTIVITY LEDGER
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/10">
              SQLITE 3 (WAL)
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F4F5F7]">
            Operation History
          </h1>
          <p className="text-sm text-[#A1A7B5] mt-1 font-mono">
            Persisted metadata records of local cryptographic operations. Plaintext payloads and passphrases are never stored.
          </p>
        </div>

        {records.length > 0 && (
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#11141D] border border-red-500/30 hover:border-red-500/60 text-xs font-mono text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-end"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#11141D] p-3 rounded-2xl border border-white/[0.08]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#737B8C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by filename or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#07080C] border border-white/[0.08] rounded-xl text-white placeholder-[#737B8C] focus:outline-none focus:border-[#A78BFA] font-mono"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 text-xs bg-[#07080C] border border-white/[0.08] rounded-xl text-[#F4F5F7] focus:outline-none focus:border-[#A78BFA] font-mono"
          >
            <option value="ALL">All Operation Types</option>
            <option value="ENCODE_TEXT">Encode Text</option>
            <option value="ENCODE_FILE">Encode File</option>
            <option value="EXTRACT_PAYLOAD">Extract Payload</option>
            <option value="ANALYZE_IMAGE">Analyze Image</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 text-xs bg-[#07080C] border border-white/[0.08] rounded-xl text-[#F4F5F7] focus:outline-none focus:border-[#A78BFA] font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Table Records Card */}
      <div className="rounded-2xl bg-[#11141D] border border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#737B8C]">
            Loading history records...
          </div>
        ) : records.length === 0 ? (
          /* Designed Empty State with Abstract Geometric Line Ledger */
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center p-3 relative">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="12" x2="32" y2="12" stroke="#737B8C" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
                <line x1="8" y1="20" x2="26" y2="20" stroke="#A1A7B5" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="28" x2="20" y2="28" stroke="#737B8C" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
                <circle cx="30" cy="24" r="3" stroke="#A78BFA" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Nothing concealed. Yet.</h3>
              <p className="text-xs text-[#A1A7B5] max-w-sm">
                Your recent operations will appear here when you begin working with VEIL.
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="px-5 py-2.5 rounded-xl bg-[#F4F5F7] text-[#07080C] hover:bg-white text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>Open the Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0D13] text-[#737B8C] font-mono text-[11px] border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Input Carrier</th>
                  <th className="py-3 px-4">Output / Target</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {r.operationType.includes('ENCODE') ? (
                          <Lock className="w-3.5 h-3.5 text-[#A78BFA]" />
                        ) : r.operationType.includes('EXTRACT') ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className="font-semibold text-white">
                          {r.operationType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {r.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A1A7B5] truncate max-w-[160px]">
                      {r.inputFilename || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#A1A7B5] truncate max-w-[160px]">
                      {r.outputFilename || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#737B8C] text-[11px]">
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/[0.08] text-xs text-[#A1A7B5] font-mono">
            <span>
              Page {page + 1} of {totalPages} ({totalCount} total operations)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className="px-3 py-1.5 rounded-lg bg-[#07080C] border border-white/[0.08] text-white disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                className="px-3 py-1.5 rounded-lg bg-[#07080C] border border-white/[0.08] text-white disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Operation Details Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Operation Metadata Details"
        maxWidth="lg"
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                <span className="text-[10px] text-[#737B8C] uppercase block">Operation ID</span>
                <span className="break-all text-[11px]">{selectedRecord.id}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                <span className="text-[10px] text-[#737B8C] uppercase block">Operation Type</span>
                <span className="font-semibold text-white">{selectedRecord.operationType}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                <span className="text-[10px] text-[#737B8C] uppercase block">Status</span>
                <span
                  className={selectedRecord.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}
                >
                  {selectedRecord.status}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                <span className="text-[10px] text-[#737B8C] uppercase block">Payload Category</span>
                <span>{selectedRecord.payloadType || 'NONE'}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                <span className="text-[10px] text-[#737B8C] uppercase block">Input Carrier</span>
                <span className="truncate block">{selectedRecord.inputFilename || 'None'}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                <span className="text-[10px] text-[#737B8C] uppercase block">Output File</span>
                <span className="truncate block">{selectedRecord.outputFilename || 'None'}</span>
              </div>
              {selectedRecord.inputImageWidth && (
                <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                  <span className="text-[10px] text-[#737B8C] uppercase block">Dimensions</span>
                  <span>
                    {selectedRecord.inputImageWidth} × {selectedRecord.inputImageHeight} px
                  </span>
                </div>
              )}
              {selectedRecord.payloadSizeBytes !== null && selectedRecord.payloadSizeBytes !== undefined && (
                <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08]">
                  <span className="text-[10px] text-[#737B8C] uppercase block">Payload Size</span>
                  <span>{selectedRecord.payloadSizeBytes} bytes</span>
                </div>
              )}
            </div>

            {selectedRecord.estimatedCapacityBytes !== null && selectedRecord.estimatedCapacityBytes !== undefined && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span className="text-[10px] uppercase block">Carrier Raw Capacity</span>
                <span className="text-base font-bold">{(selectedRecord.estimatedCapacityBytes / 1024).toFixed(1)} KiB</span>
                {selectedRecord.encryptedPayloadSizeBytes !== null && selectedRecord.encryptedPayloadSizeBytes !== undefined && (
                  <span className="text-[11px] block text-emerald-400/80 mt-0.5">
                    Ciphertext Size: {selectedRecord.encryptedPayloadSizeBytes} bytes
                  </span>
                )}
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#07080C] border border-white/[0.08] text-[11px] text-[#A1A7B5]">
              <span className="text-[10px] text-[#737B8C] uppercase block mb-1">Privacy Guarantee</span>
              <p>
                Passwords, master encryption keys, and plaintext secret messages are deliberately discarded from memory immediately after execution and are never recorded to SQLite.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Local History"
      >
        <div className="space-y-4 text-xs font-mono">
          <p className="text-slate-300">
            Are you sure you want to delete all historical operation records from the local SQLite database? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearHistory}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isClearing ? 'Clearing...' : 'Yes, Delete All'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
