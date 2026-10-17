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
} from 'lucide-react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/feedback/Toast';
import { api, ApiError } from '../../services/api';
import { OperationRecord } from '../../types';

export const OperationHistoryView: React.FC = () => {
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-100">Operation History</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              SQLite 3 Local
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Persisted metadata records of local cryptographic and steganographic operations. Zero secrets stored.
          </p>
        </div>

        {records.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
          >
            Clear History
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by filename or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-violet"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-violet"
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
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-violet"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Table Records Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading history records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No operation records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Input Carrier</th>
                  <th className="py-3 px-4">Output / Target</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {r.operationType.includes('ENCODE') ? (
                          <Lock className="w-3.5 h-3.5 text-brand-violet" />
                        ) : r.operationType.includes('EXTRACT') ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span className="font-semibold text-slate-200">
                          {r.operationType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[160px]">
                      {r.inputFilename || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[160px]">
                      {r.outputFilename || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
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
          <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400 font-mono">
            <span>
              Page {page + 1} of {totalPages} ({totalCount} total operations)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

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
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Operation ID</span>
                <span className="break-all text-[11px]">{selectedRecord.id}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Operation Type</span>
                <span className="font-semibold text-slate-100">{selectedRecord.operationType}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Status</span>
                <span
                  className={selectedRecord.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}
                >
                  {selectedRecord.status}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Payload Category</span>
                <span>{selectedRecord.payloadType || 'NONE'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Input Carrier</span>
                <span className="truncate block">{selectedRecord.inputFilename || 'None'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Output File</span>
                <span className="truncate block">{selectedRecord.outputFilename || 'None'}</span>
              </div>
              {selectedRecord.inputImageWidth && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Dimensions</span>
                  <span>
                    {selectedRecord.inputImageWidth} × {selectedRecord.inputImageHeight} px
                  </span>
                </div>
              )}
              {selectedRecord.payloadSizeBytes !== null && selectedRecord.payloadSizeBytes !== undefined && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Payload Size</span>
                  <span>{selectedRecord.payloadSizeBytes.toLocaleString()} bytes</span>
                </div>
              )}
              {selectedRecord.failureCategory && (
                <div className="col-span-2 p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300">
                  <span className="text-[10px] uppercase block text-red-400">Failure Reason</span>
                  <span>{selectedRecord.failureCategory}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Zero plaintext secret messages or encryption keys are ever logged or saved to database storage.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Clear Operation History"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete all operation metadata from the local SQLite database? This action is permanent and cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsClearModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isClearing}
              onClick={handleClearHistory}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear All Records
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
