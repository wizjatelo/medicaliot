import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPatients, getDevices, linkDevice } from '../services/api';
import { Plus, Search, Link as LinkIcon } from 'lucide-react';
import AddPatientModal from '../components/AddPatientModal';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    loadPatients();
  }, [search]);

  const loadPatients = async () => {
    try {
      const { data } = await getPatients({ search });
      setPatients(data.patients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const { data } = await getDevices();
      const unlinkedDevices = data.devices.filter(
        device => device.status === 'unlinked' || !device.patientLinks || device.patientLinks.length === 0
      );
      setDevices(unlinkedDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleOpenLinkModal = (patient) => {
    setSelectedPatient(patient);
    setShowLinkModal(true);
    loadDevices();
  };

  const handleLinkDevice = async () => {
    if (!selectedDevice) {
      setLinkError('Please select a device');
      return;
    }

    setLinkError('');
    setLinkLoading(true);

    try {
      await linkDevice(selectedDevice, selectedPatient.id);
      setShowLinkModal(false);
      setSelectedDevice('');
      setSelectedPatient(null);
      loadPatients();
    } catch (err) {
      setLinkError(err.response?.data?.error || 'Failed to link device');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patients</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </button>
      </div>

      <AddPatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadPatients}
      />

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnoses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{patient.fullName}</div>
                    <div className="text-sm text-gray-500">{patient.nationalId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {patient.diagnoses.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {patient.deviceLinks[0]?.device?.deviceCode ? (
                      <span className="text-green-600 font-medium">
                        {patient.deviceLinks[0].device.deviceCode}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenLinkModal(patient)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Link Device
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link to={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-900">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Link Device to {selectedPatient?.fullName}</h2>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedDevice('');
                  setLinkError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {linkError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {linkError}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Select Device</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a device --</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.deviceCode} - {device.label || 'No label'}
                    </option>
                  ))}
                </select>
                {devices.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No unlinked devices available. Register a device first.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedDevice('');
                    setLinkError('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkDevice}
                  disabled={linkLoading || !selectedDevice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {linkLoading ? 'Linking...' : 'Link Device'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
