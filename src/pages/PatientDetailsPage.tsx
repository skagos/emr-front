import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  AlertCircle,
  Droplet,
  Eye,
  FileText,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { Patient } from '../types';

// (προαιρετικά) Αν έχεις τύπο Visit, μπορείς να τον βάλεις εδώ
interface Visit {
  id: string;
  date: string;
  reason?: string;
  notes?: string;
  doctorName?: string;
  studyInstanceUid?: string | null;
  diagnosis?: string;
  followUpDate?: string;
  treatment?: string;
}

interface PatientDetailsPageProps {
  patientId: string | null;
  onBack: () => void;
  onStartNewVisit?: (patientId: string) => void; // <-- NEW optional prop
}

// NOTE: this component expects Tailwind configured with `darkMode: 'class'` in tailwind.config.js

export default function PatientDetailsPage({ patientId, onBack, onStartNewVisit }: PatientDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  // Theme handling for dual-mode (light/dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (e) {
      /* ignore */
    }

    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const API_BASE = 'http://localhost:8080/api/patients';
  const VISITS_API = 'http://localhost:8080/api/visits';

  useEffect(() => {
    if (!patientId) return;

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/${patientId}`);
        if (!res.ok) throw new Error('Failed to fetch patient');
        const data = await res.json();
        setPatient(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchVisits = async () => {
      try {
        setLoadingVisits(true);
        const res = await fetch(`${VISITS_API}/patient/${patientId}`);
        if (!res.ok) throw new Error('Failed to fetch visits');
        const data = await res.json();

        // ταξινόμηση (πιο πρόσφατες πρώτες)
        const sorted = data.sort(
          (a: Visit, b: Visit) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setVisits(sorted);
      } catch (err) {
        console.error('Error fetching visits:', err);
      } finally {
        setLoadingVisits(false);
      }
    };

    fetchPatient();
    fetchVisits();
  }, [patientId]);

  const handleEdit = () => {
    if (patient) {
      setFormData({ ...patient });
      setIsEditing(true);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  // ✅ Save updated patient
  const handleSave = async () => {
    if (!patientId) return;

    try {
      const res = await fetch(`${API_BASE}/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update patient');

      const updated = await res.json();
      setPatient(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChange = (field: keyof Patient, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // 🌀 Loading state
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-300">
        Loading patient details...
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="text-center py-12 text-red-600 dark:text-red-400">
        Error loading patient: {error}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-300">No patient selected</p>
          <button
            onClick={onBack}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Go back to patients list
          </button>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? formData : patient;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Patients
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-sm focus:outline-none"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="sr-only">Toggle theme</span>
            </button>

             {/* NEW: Start Visit button (visible when patient exists) */}
            {patient && (
              <button
                onClick={() => onStartNewVisit?.(patient.id)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" /> {/* import Plus from lucide-react at top */}
                New Visit
              </button>
            )}

          </div>

          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Edit Patient
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Patient Info */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                {displayData?.firstName?.[0]}
                {displayData?.lastName?.[0]}
              </div>
              <div className="text-white">
                {isEditing ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="px-3 py-2 bg-white/90 dark:bg-gray-800/60 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="px-3 py-2 bg-white/90 dark:bg-gray-800/60 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold">
                    {displayData?.firstName} {displayData?.lastName}
                  </h1>
                )}
                {!isEditing && displayData?.dateOfBirth && (
                  <p className="text-blue-100 mt-1">
                    {calculateAge(displayData.dateOfBirth)} years old • {displayData.gender}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Information</h3>

                {/* Date of Birth */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">
                      {displayData?.dateOfBirth && formatDate(displayData.dateOfBirth)}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Activity className="w-4 h-4" />
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{displayData?.gender}</p>
                  )}
                </div>

                {/* Blood Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Droplet className="w-4 h-4" />
                    Blood Type
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.bloodType || ''}
                      onChange={(e) => handleChange('bloodType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{displayData?.bloodType || '-'}</p>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{displayData?.phone || '-'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{displayData?.email || '-'}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{displayData?.address || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Medical Information</h3>
              <div className="space-y-6">
                {/* Allergies */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Allergies
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.allergies || ''}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p
                      className={`${
                        displayData?.allergies ? 'text-red-700 font-medium' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {displayData?.allergies || 'No known allergies'}
                    </p>
                  )}
                </div>

                {/* Medical History */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Medical History
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.medicalHistory || ''}
                      onChange={(e) => handleChange('medicalHistory', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {displayData?.medicalHistory || 'No medical history recorded'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Visits Section */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Patient Visits</h3>

              {loadingVisits ? (
                <p className="text-gray-500 dark:text-gray-400">Loading visits...</p>
              ) : visits.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No visits recorded for this patient.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visits.map((visit) => (
                    <li key={visit.id} className="flex">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Visit Details</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <Calendar className="w-4 h-4" />
                              Visit Date
                            </label>
                            <p className="text-gray-900 dark:text-gray-100">{formatDateTime(visit.date)}</p>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <FileText className="w-4 h-4" />
                              Reason
                            </label>
                            <p className="text-gray-900 dark:text-gray-100">{visit.reason}</p>
                          </div>

                          {visit.diagnosis && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Diagnosis</label>
                              <p className="text-gray-900 dark:text-gray-100">{visit.diagnosis}</p>
                            </div>
                          )}

                          {visit.treatment && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Treatment</label>
                              <p className="text-gray-900 dark:text-gray-100">{visit.treatment}</p>
                            </div>
                          )}

                          {visit.notes && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes</label>
                              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{visit.notes}</p>
                            </div>
                          )}

                          {visit.followUpDate && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Follow-up Date</label>
                              <p className="text-gray-900 dark:text-gray-100">{formatDate(visit.followUpDate)}</p>
                            </div>
                          )}

                          {visit.studyInstanceUid && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Imaging</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const ohifUrl = `http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${visit.studyInstanceUid}`;
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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
