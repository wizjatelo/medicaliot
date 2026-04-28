import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPatient, getPatientAdherence } from '../services/api';
import { User, Activity, Pill } from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [patientRes, adherenceRes] = await Promise.all([
        getPatient(id),
        getPatientAdherence(id, 7)
      ]);
      setPatient(patientRes.data.patient);
      setAdherence(adherenceRes.data);
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!patient) return <div className="text-center py-12">Patient not found</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{patient.fullName}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Patient Information
          </h2>
          <div className="space-y-2">
            <p><span className="font-semibold">DOB:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            <p><span className="font-semibold">Gender:</span> {patient.gender}</p>
            <p><span className="font-semibold">National ID:</span> {patient.nationalId}</p>
            <p><span className="font-semibold">Phone:</span> {patient.phone}</p>
            <p><span className="font-semibold">County:</span> {patient.county}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Adherence (7 days)
          </h2>
          {adherence && (
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {adherence.adherenceRate}%
              </div>
              <p className="text-sm text-gray-600">
                {adherence.dosesTaken} taken / {adherence.totalDoses} scheduled
              </p>
              <p className="text-sm text-red-600 mt-2">
                {adherence.dosesMissed} missed doses
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Pill className="w-5 h-5 mr-2" />
            Active Prescriptions
          </h2>
          <div className="space-y-3">
            {patient.prescriptions.map((rx) => (
              <div key={rx.id} className="border-l-4 border-blue-500 pl-3">
                <p className="font-semibold">{rx.medication.name}</p>
                <p className="text-sm text-gray-600">
                  {rx.doseTimes.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
