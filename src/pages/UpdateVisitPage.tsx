import React, { useEffect, useState } from "react";
import {
  Save,
  Calendar,
  FileText,
  Stethoscope,
  Pill,
  ClipboardList,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";

interface UpdateVisitPageProps {
  visitId: string | null;
  onBack: () => void;
}

interface VisitData {
  id: string;
  visitDate: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  followUpDate: string;
  studyInstanceUid?: string;
  status?:string;
  patient?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    allergies?: string;
  };
}

export default function UpdateVisitPage({ visitId, onBack }: UpdateVisitPageProps) {
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VisitData>>({});

  useEffect(() => {
    if (!visitId) return;

    const fetchVisit = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/visits/${visitId}`);
        if (!res.ok) throw new Error("Failed to fetch visit");
        const data = await res.json();
        setVisit(data);
        setFormData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [visitId]);

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!visitId) return;

    try {
      const res = await fetch(`http://localhost:8080/api/visits/${visitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update visit");

      alert("✅ Visit updated successfully!");
      onBack();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        Loading visit details...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center mt-10">
        Error loading visit: {error}
      </div>
    );

  if (!visit)
    return (
      <div className="text-center text-gray-500 mt-10">No visit found.</div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Update Visit
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Modify existing visit details
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="space-y-8">
        {/* Patient Info */}
        {visit.patient && (
          <Section title="Patient Information" icon={ClipboardList}>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {visit.patient.firstName} {visit.patient.lastName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {visit.patient.phone} • {visit.patient.email}
              </div>
              {visit.patient.allergies && (
                <div className="text-sm text-red-500 mt-1 font-medium">
                  Allergies: {visit.patient.allergies}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Visit Details */}
        <Section title="Visit Details" icon={FileText}>
          <FormInput
            label="Visit Date & Time"
            type="datetime-local"
            icon={Calendar}
            value={formData.visitDate || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("visitDate", e.target.value)
            }
          />

        <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 select-none">
            <FileText className="w-4 h-4" />
            Reason for Visit
        </label>
        <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 select-none cursor-default whitespace-pre-line">
            {formData.reason && formData.reason.trim() !== ""
            ? formData.reason
            : "—"}
        </div>
        </div>

        </Section>
        {/* Clinical Info */}
        <Section title="Clinical Information" icon={Stethoscope}>
          <FormTextArea
            label="Diagnosis"
            icon={Stethoscope}
            value={formData.diagnosis || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleChange("diagnosis", e.target.value)
            }
          />

          <FormTextArea
            label="Treatment & Prescriptions"
            icon={Pill}
            value={formData.treatment || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleChange("treatment", e.target.value)
            }
          />

          <FormTextArea
            label="Additional Notes"
            icon={ClipboardList}
            value={formData.notes || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleChange("notes", e.target.value)
            }
          />

          <FormInput
            label="Follow-up Date"
            type="date"
            icon={Calendar}
            value={formData.followUpDate || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("followUpDate", e.target.value)
            }
          />
        </Section>

        {/* Imaging Info */}
        {formData.studyInstanceUid && (
          <Section title="Imaging (DICOM Study)" icon={ImageIcon}>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Study Instance UID:{" "}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                {formData.studyInstanceUid}
              </code>
            </div>
            <a
              href={`http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${formData.studyInstanceUid}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-blue-600 hover:underline"
            >
              Open in OHIF Viewer →
            </a>
          </Section>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
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
