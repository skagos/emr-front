import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Patient } from "../types";

interface NewVisitPageProps {
  preselectedPatientId?: string | null;
}

export default function NewVisitPage({ preselectedPatientId }: NewVisitPageProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(!preselectedPatientId);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    visitDate: "",
    reason: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    followUpDate: "",
    studyInstanceUid: "",
  });

  const [dicomFiles, setDicomFiles] = useState<FileList | null>(null);
  const [dicomUploadStatus, setDicomUploadStatus] = useState<string | null>(null);
  const [dicomUploading, setDicomUploading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8080/api/patients");
        if (!res.ok) throw new Error("Failed to fetch patients");
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
      setDicomUploadStatus("Please select DICOM files or a study folder first.");
      return;
    }

    setDicomUploading(true);
    setDicomUploadStatus("Uploading to Orthanc...");

    let successCount = 0;
    let failCount = 0;
    const failedFiles: string[] = [];
    const studyIds = new Set<string>();

    for (const file of Array.from(dicomFiles)) {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".dcm")) continue;

      try {
        const res = await fetch("http://localhost:5001/instances", {
          method: "POST",
          headers: { "Content-Type": "application/dicom" },
          body: file,
        });
        const payload = await res.json().catch(() => null);

        if (!res.ok || !payload?.ok) {
          failCount++;
          failedFiles.push(file.name);
        } else {
          successCount++;
          const orthancInfo = payload.orthanc || {};
          if (orthancInfo.ParentStudy) studyIds.add(orthancInfo.ParentStudy);
        }
      } catch {
        failCount++;
        failedFiles.push(file.name);
      }
    }

    const studiesArr = Array.from(studyIds);
    if (studiesArr.length > 0) {
      const firstStudyId = studiesArr[0];
      try {
        const infoRes = await fetch(`http://localhost:5001/study-info/${firstStudyId}`);
        const infoJson = await infoRes.json();
        if (infoJson?.studyInstanceUID) {
          setFormData((prev) => ({ ...prev, studyInstanceUid: infoJson.studyInstanceUID }));
          const ohifUrl = `http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${infoJson.studyInstanceUID}`;
          window.open(ohifUrl, "_blank");
        }
      } catch (e) {
        console.error("Failed to fetch study-info:", e);
      }
    }

    let summary = [];
    if (successCount > 0) summary.push(`Uploaded ${successCount} file(s).`);
    if (failCount > 0) summary.push(`Failed ${failCount} file(s).`);
    if (studiesArr.length > 0) summary.push(`Orthanc Study IDs: ${studiesArr.join(", ")}`);

    const statusText = summary.join("\n") || "No response from Orthanc.";
    if (failCount === 0 && successCount > 0)
      setDicomUploadStatus("✅ " + statusText);
    else if (successCount === 0)
      setDicomUploadStatus("❌ " + statusText);
    else
      setDicomUploadStatus("⚠ " + statusText);

    setDicomUploading(false);
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  const handleChange = (field: string, value: string) =>
    setFormData({ ...formData, [field]: value });

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setShowPatientSearch(false);
    setSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await fetch("http://localhost:8080/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          patient: { id: selectedPatient.id },
        }),
      });
      if (!response.ok) throw new Error("Failed to save visit");
      alert("Visit saved successfully");
      setFormData({
        visitDate: "",
        reason: "",
        diagnosis: "",
        treatment: "",
        notes: "",
        followUpDate: "",
        studyInstanceUid: "",
      });
      setSelectedPatient(null);
      setShowPatientSearch(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const isFormValid = selectedPatient && formData.reason.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          New Visit
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Record a new patient visit
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Patient Selection */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Patient Selection
          </h3>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading patients...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : !selectedPatient ? (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patient by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {searchQuery && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {p.phone} • {p.email}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No patients found
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPatient.phone} • {selectedPatient.email}
                </div>
                {selectedPatient.allergies && (
                  <div className="text-sm text-red-500 mt-1 font-medium">
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
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Visit Details */}
        {selectedPatient && (
          <>
            <Section title="Visit Details" icon={FileText}>
              <FormInput
                label="Visit Date & Time"
                type="datetime-local"
                icon={Calendar}
                value={formData.visitDate}
                onChange={(e :React.ChangeEvent<HTMLInputElement>) => handleChange("visitDate", e.target.value)}
              />

              <FormTextArea
                label="Reason for Visit *"
                icon={FileText}
                value={formData.reason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("reason", e.target.value)}
                placeholder="What brings the patient in today?"
                required
              />
            </Section>

            <Section title="Clinical Information" icon={Stethoscope}>
              <FormTextArea
                label="Diagnosis"
                icon={Stethoscope}
                value={formData.diagnosis}
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => handleChange("diagnosis", e.target.value)}
              />

              <FormTextArea
                label="Treatment & Prescriptions"
                icon={Pill}
                value={formData.treatment}
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => handleChange("treatment", e.target.value)}
              />

              <FormTextArea
                label="Additional Notes"
                icon={ClipboardList}
                value={formData.notes}
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => handleChange("notes", e.target.value)}
              />

              <FormInput
                label="Follow-up Date"
                type="date"
                icon={Calendar}
                value={formData.followUpDate}
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => handleChange("followUpDate", e.target.value)}
              />
            </Section>

            {/* DICOM Upload */}
            <Section title="Imaging (DICOM Upload to Orthanc)" icon={ImageIcon}>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select DICOM files or a study folder:
                </label>
                <input
                  type="file"
                  multiple
                  // @ts-ignore
                  webkitdirectory="true"
                  directory=""
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setDicomFiles(files);
                      setDicomUploadStatus(null);
                    } else {
                      setDicomFiles(null);
                    }
                  }}
                  className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-700 file:bg-white dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-100 dark:hover:file:bg-gray-700 cursor-pointer"
                />

                {dicomFiles && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {dicomFiles.length} file(s) selected
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={dicomUploading || !dicomFiles?.length}
                    onClick={handleDicomUploadToOrthanc}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <UploadIcon className="w-4 h-4" />
                    {dicomUploading ? "Uploading..." : "Upload to Orthanc"}
                  </button>

                  {dicomUploadStatus && (
                    <span
                      className={`whitespace-pre-line text-sm ${
                        dicomUploadStatus.startsWith("✅")
                          ? "text-green-500"
                          : dicomUploadStatus.startsWith("❌")
                          ? "text-red-500"
                          : dicomUploadStatus.startsWith("⚠")
                          ? "text-yellow-500"
                          : "text-gray-400"
                      }`}
                    >
                      {dicomUploadStatus}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  These files are sent to your local Orthanc via proxy at{" "}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                    http://localhost:5001
                  </code>
                  . They never leave your local machine.
                </p>
              </div>
            </Section>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    visitDate: "",
                    reason: "",
                    diagnosis: "",
                    treatment: "",
                    notes: "",
                    followUpDate: "",
                    studyInstanceUid: "",
                  });
                  setSelectedPatient(null);
                  setShowPatientSearch(true);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
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

/* ---------- Reusable UI helpers ---------- */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-blue-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormInput({
  label,
  type,
  icon: Icon,
  value,
  onChange,
  required,
}: any) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>
  );
}

function FormTextArea({
  label,
  icon: Icon,
  value,
  onChange,
  required,
  placeholder,
}: any) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>
  );
}
