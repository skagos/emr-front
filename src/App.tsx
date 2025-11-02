import { useState } from 'react';
import Navigation from './components/Navigation';
import CalendarPage from './pages/CalendarPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import NewVisitPage from './pages/NewVisitPage';
import VisitHistoryPage from './pages/VisitHistoryPage';
import PatientFormModal from './components/PatientFormModal';
import { Patient } from './types';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [currentPage, setCurrentPage] = useState('calendar');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patient-details');
  };

  const handleCreatePatient = () => {
    setIsPatientModalOpen(true);
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    setIsPatientModalOpen(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page === 'patients') {
      setSelectedPatientId(null);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <CalendarPage />;
      case 'patients':
        return (
          <PatientsPage
            onViewPatient={handleViewPatient}
            onCreatePatient={handleCreatePatient}
          />
        );
      case 'patient-details':
        return (
          <PatientDetailsPage
            patientId={selectedPatientId}
            onBack={() => setCurrentPage('patients')}
          />
        );
      case 'new-visit':
        return <NewVisitPage preselectedPatientId={selectedPatientId} />;
      case 'history':
        return <VisitHistoryPage />;
      default:
        return <CalendarPage />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        {renderPage()}
        <PatientFormModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          onSave={handleSavePatient}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
