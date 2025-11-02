import React, { useEffect, useState } from 'react';

interface UpdateVisitPageProps {
  visitId: string | null;
  onBack: () => void;
}

interface VisitData {
  id: string;
  date: string;
  notes: string;
  // add other fields as needed
}

export default function UpdateVisitPage({ visitId, onBack }: UpdateVisitPageProps) {
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visitId) return;

    const fetchVisit = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/visits/${visitId}`);
        if (!res.ok) throw new Error('Failed to fetch visit');
        const data = await res.json();
        setVisit(data);
        setNotes(data.notes || '');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [visitId]);

  const handleSave = async () => {
    if (!visitId) return;

    try {
      const res = await fetch(`http://localhost:8080/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...visit, notes }),
      });

      if (!res.ok) throw new Error('Failed to update visit');

      alert('Visit updated successfully!');
      onBack(); // go back or you can do other navigation
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div>Loading visit...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!visit) return <div>No visit found.</div>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Update Visit</h2>

      <label className="block mb-2 font-semibold">Visit Date</label>
      <input
        type="date"
        value={visit.date}
        disabled
        className="mb-4 p-2 border rounded w-full"
      />

      <label className="block mb-2 font-semibold">Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
        rows={5}
      />

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={onBack}
        className="ml-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}
