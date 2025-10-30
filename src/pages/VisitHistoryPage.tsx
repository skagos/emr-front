import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Calendar, User, FileText, Eye, Filter } from 'lucide-react';
import { VisitWithPatient } from '../types';

export default function VisitHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [visits, setVisits] = useState<VisitWithPatient[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPatient | null>(null);

  // ✅ Fetch visits από backend
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/visits'); // <-- άλλαξε το URL αν χρειάζεται
        setVisits(res.data);
      } catch (err) {
        console.error('Error fetching visits:', err);
      }
    };
    fetchVisits();
  }, []);

  // 🔍 Filtering (αναζήτηση + ημερομηνία)
  const filteredVisits = visits.filter((visit) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      visit.patient?.firstName?.toLowerCase().includes(query) ||
      visit.patient?.lastName?.toLowerCase().includes(query) ||
      visit.reason?.toLowerCase().includes(query) ||
      visit.diagnosis?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;

    const visitDate = new Date(visit.visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return visitDate.toDateString() === today.toDateString();
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return visitDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return visitDate >= monthAgo;
      }
      default:
        return true;
    }
  });

  // 📅 Helpers για format ημερομηνιών
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Visit History</h2>
        <p className="text-gray-600">View and search all patient visits</p>
      </div>

      {/* 🔍 Search + Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by patient name, reason, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* 🧾 Visits List + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🩺 Visits List */}
        <div className="lg:col-span-2">
          {visits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No visits recorded</h3>
              <p className="text-gray-600">Visit records will appear here once created</p>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No visits found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVisits.map((visit) => (
                <div
                  key={visit.id}
                  className={`bg-white rounded-lg shadow-sm border transition-all cursor-pointer ${
                    selectedVisit?.id === visit.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVisit(visit)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                          {visit.patient?.firstName?.[0]}
                          {visit.patient?.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {visit.patient?.firstName} {visit.patient?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(visit.visitDate)}
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 p-2">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Reason: </span>
                        <span className="text-sm text-gray-900">{visit.reason}</span>
                      </div>
                      {visit.diagnosis && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Diagnosis: </span>
                          <span className="text-sm text-gray-900">{visit.diagnosis}</span>
                        </div>
                      )}
                      {visit.followUpDate && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                            <Calendar className="w-3 h-3" />
                            Follow-up: {formatDate(visit.followUpDate)}
                          </span>
                        </div>
                      )}
                        {/* ✅ κουμπί για OHIF μόνο αν υπάρχει StudyInstanceUid */}
                        {visit.studyInstanceUid && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const ohifUrl = `http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${visit.studyInstanceUid}`;
                                window.open(ohifUrl, '_blank');
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Imaging
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 👁️ Visit Details Panel */}
        <div className="lg:col-span-1">
          {selectedVisit ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4" />
                    Patient
                  </label>
                  <p className="text-gray-900">
                    {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName}
                  </p>
                  {selectedVisit.patient?.allergies && (
                    <p className="text-xs text-red-600 mt-1">
                      Allergies: {selectedVisit.patient.allergies}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4" />
                    Visit Date
                  </label>
                  <p className="text-gray-900">{formatDateTime(selectedVisit.visitDate)}</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4" />
                    Reason
                  </label>
                  <p className="text-gray-900">{selectedVisit.reason}</p>
                </div>

                {selectedVisit.diagnosis && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Diagnosis</label>
                    <p className="text-gray-900">{selectedVisit.diagnosis}</p>
                  </div>
                )}

                {selectedVisit.treatment && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Treatment</label>
                    <p className="text-gray-900">{selectedVisit.treatment}</p>
                  </div>
                )}

                {selectedVisit.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedVisit.notes}</p>
                  </div>
                )}

                {selectedVisit.followUpDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Follow-up Date</label>
                    <p className="text-gray-900">{formatDate(selectedVisit.followUpDate)}</p>
                  </div>
                )}
                  {/* ✅ κουμπί OHIF viewer στο details panel */}
                  {selectedVisit.studyInstanceUid && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Imaging</label>
                      <button
                        type="button"
                        onClick={() => {
                          const ohifUrl = `http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${selectedVisit.studyInstanceUid}`;
                          window.open(ohifUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Open in OHIF Viewer
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center sticky top-8">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Select a visit to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
