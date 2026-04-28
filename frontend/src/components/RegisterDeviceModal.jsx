import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createDevice, getPatients, linkDevice } from '../services/api';

export default function RegisterDeviceModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    deviceCode: '',
    label: '',
    firmwareVersion: '',
    macAddress: '',
    loraDevEui: '',
    notes: ''
  });
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [createdDeviceId, setCreatedDeviceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && step === 2) {
      loadPatients();
    }
  }, [isOpen, step]);

  const loadPatients = async () => {
    try {
      const { data } = await getPatients({});
      setPatients(data.patients);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await createDevice(formData);
      setCreatedDeviceId(data.device.id);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPatient = async () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await linkDevice(createdDeviceId, selectedPatient);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to link device');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLink = () => {
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      deviceCode: '',
      label: '',
      firmwareVersion: '',
      macAddress: '',
      loraDevEui: '',
      notes: ''
    });
    setSelectedPatient('');
    setCreatedDeviceId(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">
            {step === 1 ? 'Register New Device' : 'Link to Patient'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegisterDevice}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Device Code *</label>
                  <input
                    type="text"
                    name="deviceCode"
                    value={formData.deviceCode}
                    onChange={handleChange}
                    placeholder="e.g., MD-001"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Label</label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    placeholder="e.g., Ward A - Room 101"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Firmware Version</label>
                  <input
                    type="text"
                    name="firmwareVersion"
                    value={formData.firmwareVersion}
                    onChange={handleChange}
                    placeholder="e.g., v1.0.0"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">MAC Address</label>
                  <input
                    type="text"
                    name="macAddress"
                    value={formData.macAddress}
                    onChange={handleChange}
                    placeholder="e.g., AA:BB:CC:DD:EE:FF"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">LoRa DevEUI</label>
                  <input
                    type="text"
                    name="loraDevEui"
                    value={formData.loraDevEui}
                    onChange={handleChange}
                    placeholder="e.g., 0123456789ABCDEF"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Registering...' : 'Register Device'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Device registered successfully! Would you like to link it to a patient now?
              </p>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} ({patient.nationalId || 'No ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSkipLink}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleLinkPatient}
                  disabled={loading || !selectedPatient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Linking...' : 'Link Patient'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
