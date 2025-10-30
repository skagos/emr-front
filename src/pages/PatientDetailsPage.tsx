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
} from 'lucide-react';
import { Patient } from '../types';

// (προαιρετικά) Αν έχεις τύπο Visit, μπορείς να τον βάλεις εδώ
interface Visit {
  id: string;
  date: string;
  reason?: string;
  notes?: string;
  doctorName?: string;
}

interface PatientDetailsPageProps {
  patientId: string | null;
  onBack: () => void;
}

export default function PatientDetailsPage({ patientId, onBack }: PatientDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  const API_BASE = 'http://localhost:8080/api/patients';
  const VISITS_API = 'http://localhost:8080/api/visits';

  // ✅ Fetch patient and visits
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
    new Date(dateString).toLocaleDateString('en-US', {
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
      <div className="text-center py-12 text-gray-600">
        Loading patient details...
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading patient: {error}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No patient selected</p>
          <button
            onClick={onBack}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Go back to patients list
          </button>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? formData : patient;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Patients
        </button>

        {!isEditing ? (
          
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Edit Patient
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={() =>
                window.open(
                  'http://localhost:8042/ohif/viewer?StudyInstanceUIDs=1.2.840.113564.236.177.215.64.112.217.20230814125825063.1060',
                  '_blank'
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Viewer
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
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
                    className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

              {/* Date of Birth */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {displayData?.dateOfBirth && formatDate(displayData.dateOfBirth)}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Activity className="w-4 h-4" />
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{displayData?.gender}</p>
                )}
              </div>

              {/* Blood Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Droplet className="w-4 h-4" />
                  Blood Type
                </label>
                {isEditing ? (
                  <select
                    value={formData.bloodType || ''}
                    onChange={(e) => handleChange('bloodType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <p className="text-gray-900">{displayData?.bloodType || '-'}</p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{displayData?.phone || '-'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{displayData?.email || '-'}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{displayData?.address || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
            <div className="space-y-6">
              {/* Allergies */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Allergies
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.allergies || ''}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p
                    className={`${
                      displayData?.allergies ? 'text-red-700 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {displayData?.allergies || 'No known allergies'}
                  </p>
                )}
              </div>

              {/* Medical History */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Medical History
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.medicalHistory || ''}
                    onChange={(e) => handleChange('medicalHistory', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {displayData?.medicalHistory || 'No medical history recorded'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Visits Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Visits</h3>

            {loadingVisits ? (
              <p className="text-gray-500">Loading visits...</p>
            ) : visits.length === 0 ? (
              <p className="text-gray-500">No visits recorded for this patient.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {visits.map((visit) => (
                  <li key={visit.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(visit.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {visit.reason || 'No reason specified'}
                        </p>
                        {visit.notes && (
                          <p className="text-gray-700 text-sm mt-1 italic">{visit.notes}</p>
                        )}
                      </div>
                      {visit.doctorName && (
                        <span className="text-sm text-blue-600 font-medium">
                          Dr. {visit.doctorName}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
