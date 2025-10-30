import { useEffect, useState } from 'react';
import {
  Save,
  Search,
  Calendar,
  FileText,
  Stethoscope,
  Pill,
  ClipboardList,
  Upload as UploadIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { Patient } from '../types';

interface NewVisitPageProps {
  preselectedPatientId?: string | null;
}

export default function NewVisitPage({ preselectedPatientId }: NewVisitPageProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(!preselectedPatientId);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    visitDate: '',
    reason: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    followUpDate: '',
    studyInstanceUid: ''
  });

  // imaging upload state
  const [dicomFiles, setDicomFiles] = useState<FileList | null>(null);
  const [dicomUploadStatus, setDicomUploadStatus] = useState<string | null>(null);
  const [dicomUploading, setDicomUploading] = useState(false);

  // Load patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8080/api/patients');
        if (!res.ok) throw new Error('Failed to fetch patients');
        const data = await res.json();
        setPatients(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);


  const handleDicomUploadToOrthanc = async () => {
    if (!dicomFiles || dicomFiles.length === 0) {
      setDicomUploadStatus('Please select DICOM files or a study folder first.');
      return;
    }

    console.log('[DICOM UPLOAD] selected files:', dicomFiles.length, dicomFiles);

    setDicomUploading(true);
    setDicomUploadStatus('Uploading to Orthanc...');

    let successCount = 0;
    let failCount = 0;
    const failedFiles: string[] = [];

    // we'll collect study info here
    const studyIds = new Set<string>();            // Orthanc "ParentStudy"
    const studyInstanceUIDs = new Set<string>();   // DICOM tag StudyInstanceUID

    for (const file of Array.from(dicomFiles)) {
        const name = file.name.toLowerCase();

        if (!name.endsWith('.dcm')) {
          console.log('Skipping non-DICOM file:', file.name);
          continue;
        }

      try {
        const res = await fetch('http://localhost:5001/instances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/dicom',
          },
          body: file,
        });

        const payload = await res.json().catch(() => null);

        if (!res.ok || !payload?.ok) {
          console.error('[DICOM UPLOAD] Orthanc error for file', file.name, payload);
          failCount++;
          failedFiles.push(file.name + ' (' + res.status + ')');
        } else {
          successCount++;

          // try to pull ParentStudy and StudyInstanceUID
          const orthancInfo = payload.orthanc || {};
          console.log(orthancInfo)
            if (orthancInfo.ParentStudy) studyIds.add(orthancInfo.ParentStudy);
            const studyUidFromTags = orthancInfo.MainDicomTags?.StudyInstanceUID;
            if (studyUidFromTags) studyInstanceUIDs.add(studyUidFromTags);
          }
          // if (orthancInfo.ParentStudy) {
          //   studyIds.add(orthancInfo.ParentStudy);
          // }
          // const studyUidFromTags = orthancInfo.MainDicomTags?.StudyInstanceUID;
          // if (studyUidFromTags) {
          //   studyInstanceUIDs.add(studyUidFromTags);
          // }
        
      } catch (err: any) {
        console.error('[DICOM UPLOAD] Network/proxy error for file', file.name, err);
        failCount++;
        failedFiles.push(file.name + ' (network error)');
      }
    }

    // Build a nice summary for the UI
    const studiesArr = Array.from(studyIds);
    // const studyUidsArr = Array.from(studyInstanceUIDs);
const studyUidsArr = new Set<string>(); // θα γεμίσει τώρα από το proxy /study-info


    if (studiesArr.length > 0) {
  // πάρε μόνο το πρώτο study για τώρα
  const firstStudyId = studiesArr[0];

  try {
    const infoRes = await fetch(`http://localhost:5001/study-info/${firstStudyId}`, {
      method: 'GET',
    });
    const infoJson = await infoRes.json();
    console.log('[DICOM UPLOAD] study-info response:', infoJson);

    if (infoJson?.studyInstanceUID) {
      studyUidsArr.add(infoJson.studyInstanceUID);

      setFormData((prev) => ({
        ...prev,
        studyInstanceUid: infoJson.studyInstanceUID,
      }));

      // optional: άνοιξε OHIF αυτόματα
      const ohifUrl = `http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${infoJson.studyInstanceUID}`;
      window.open(ohifUrl, '_blank');
    }
  } catch (e) {
    console.error('Failed to fetch study-info:', e);
  }
}


    let summaryLines: string[] = [];

    if (successCount > 0) {
      summaryLines.push(`Uploaded ${successCount} file(s) successfully.`);
    }
    if (failCount > 0) {
      summaryLines.push(`Failed ${failCount} file(s).`);
      summaryLines.push(`Failed list: ${failedFiles.slice(0,5).join(', ')}${failedFiles.length > 5 ? '…' : ''}`);
    }
    if (studiesArr.length > 0) {
      summaryLines.push(`Orthanc Study IDs: ${studiesArr.join(', ')}`);
    }
    // if (studyUidsArr.length > 0) {
    //   summaryLines.push(`StudyInstanceUID(s): ${studyUidsArr.join(', ')}`);
    // }
    if (summaryLines.length === 0) {
      summaryLines.push('No response from Orthanc 🤔');
    }

    // pick status color based on fail/success
    if (failCount === 0 && successCount > 0) {
      setDicomUploadStatus('✅ ' + summaryLines.join('\n'));
    } else if (successCount === 0) {
      setDicomUploadStatus('❌ ' + summaryLines.join('\n'));
    } else {
      setDicomUploadStatus('⚠ ' + summaryLines.join('\n'));
    }

    setDicomUploading(false);
  };







  // Filter patients safely
  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    const firstName = (patient.firstName || '').toLowerCase();
    const lastName = (patient.lastName || '').toLowerCase();
    const phone = patient.phone || '';

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      phone.includes(query)
    );
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await fetch('http://localhost:8080/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patient: {
            id: selectedPatient.id,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save visit');
      alert('Visit saved successfully');
      setFormData({
        visitDate: '',
        reason: '',
        diagnosis: '',
        treatment: '',
        notes: '',
        followUpDate: '',
        studyInstanceUid: ''
      });
      setSelectedPatient(null);
      setShowPatientSearch(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const isFormValid = selectedPatient && formData.reason.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">New Visit</h2>
        <p className="text-gray-600">Record a new patient visit</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Selection</h3>

          {loading ? (
            <p className="text-gray-500">Loading patients...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : !selectedPatient ? (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patient by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {searchQuery && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-semibold text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {patient.phone} • {patient.email}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No patients found matching your search
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedPatient.phone} • {selectedPatient.email}
                </div>
                {selectedPatient.allergies && (
                  <div className="text-sm text-red-600 mt-1 font-medium">
                    Allergies: {selectedPatient.allergies}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setShowPatientSearch(true);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Change Patient
              </button>
            </div>
          )}
        </div>

        {selectedPatient && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Visit Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.visitDate}
                    onChange={(e) => handleChange('visit_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    Reason for Visit *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What brings the patient in today?"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Stethoscope className="w-4 h-4" />
                    Diagnosis
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => handleChange('diagnosis', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Clinical diagnosis"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Pill className="w-4 h-4" />
                    Treatment & Prescriptions
                  </label>
                  <textarea
                    value={formData.treatment}
                    onChange={(e) => handleChange('treatment', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prescribed medications, dosages, and treatment plan"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <ClipboardList className="w-4 h-4" />
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional observations or notes"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Follow-up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => handleChange('followUpDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Imaging / Upload to Orthanc */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Imaging (DICOM Upload to Orthanc)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select DICOM files or a study folder:
                  </label>

                  <input
                    type="file"
                    multiple
                    // σε Chrome/Edge αυτό επιτρέπει επιλογή folder και παίρνεις ΟΛΑ τα αρχεία μέσα
                    // @ts-ignore
                    webkitdirectory="true"
                    directory=""
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        console.log('[DICOM SELECT] got', files.length, 'files');
                        setDicomFiles(files);
                        setDicomUploadStatus(null);
                      } else {
                        setDicomFiles(null);
                      }
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
                  />

                  {dicomFiles && dicomFiles.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {dicomFiles.length} file(s) selected
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={dicomUploading || !dicomFiles || dicomFiles.length === 0}
                    onClick={handleDicomUploadToOrthanc}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UploadIcon className="w-4 h-4" />
                    {dicomUploading ? 'Uploading...' : 'Upload to Orthanc'}
                  </button>

                  {dicomUploadStatus && (
                    <span
                      className={`whitespace-pre-line text-sm ${
                        dicomUploadStatus.startsWith('✅')
                          ? 'text-green-600'
                          : dicomUploadStatus.startsWith('❌')
                          ? 'text-red-600'
                          : dicomUploadStatus.startsWith('⚠')
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {dicomUploadStatus}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  These files go directly to your local Orthanc through the local proxy at{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">http://localhost:5001</code>.{' '}
                  They do NOT go to the cloud backend.
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                    setFormData({
                      visitDate: '',
                      reason: '',
                      diagnosis: '',
                      treatment: '',
                      notes: '',
                      followUpDate: '',
                      studyInstanceUid: ''
                    });
                    setSelectedPatient(null);
                    setShowPatientSearch(true);
                  }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Save Visit
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
