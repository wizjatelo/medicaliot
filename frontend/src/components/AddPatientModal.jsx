import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPatient, getDevices, linkDevice } from '../services/api';

export default function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    nationalId: '',
    phone: '',
    email: '',
    address: '',
    county: '',
    ward: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    diagnoses: '',
    allergies: '',
    notes: ''
  });
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [createdPatientId, setCreatedPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && step === 2) {
      loadDevices();
    }
  }, [isOpen, step]);

  const loadDevices = async () => {
    try {
      const { data } = await getDevices();
      const unlinkedDevices = data.devices.filter(
        device => device.status === 'unlinked' || !device.patientLinks || device.patientLinks.length === 0
      );
      setDevices(unlinkedDevices);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        diagnoses: formData.diagnoses.split(',').map(d => d.trim()).filter(Boolean),
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
      };

      const { data } = await createPatient(payload);
      setCreatedPatientId(data.patient.id);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDevice = async () => {
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await linkDevice(selectedDevice, createdPatientId);
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
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      nationalId: '',
      phone: '',
      email: '',
      address: '',
      county: '',
      ward: '',
      nextOfKinName: '',
      nextOfKinPhone: '',
      diagnoses: '',
      allergies: '',
      notes: ''
    });
    setSelectedDevice('');
    setCreatedPatientId(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">
            {step === 1 ? 'Add New Patient' : 'Link Device to Patient'}
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
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">National ID</label>
                  <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">County</label>
                  <input type="text" name="county" value={formData.county} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Ward</label>
                  <input type="text" name="ward" value={formData.ward} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Next of Kin Name</label>
                  <input type="text" name="nextOfKinName" value={formData.nextOfKinName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Next of Kin Phone</label>
                  <input type="tel" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-gray-700 mb-2">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mt-4">
                <label className="block text-gray-700 mb-2">Diagnoses (comma-separated)</label>
                <input type="text" name="diagnoses" value={formData.diagnoses} onChange={handleChange} placeholder="e.g., Hypertension, Diabetes" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mt-4">
                <label className="block text-gray-700 mb-2">Allergies (comma-separated)</label>
                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g., Penicillin, Aspirin" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mt-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Creating...' : 'Create Patient'}</button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Patient created successfully! Would you like to link a device now?</p>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Select Device</label>
                <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select a device --</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>{device.deviceCode} - {device.label || 'No label'}</option>
                  ))}
                </select>
                {devices.length === 0 && (<p className="text-sm text-gray-500 mt-2">No unlinked devices available. Register a device first.</p>)}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={handleSkipLink} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Skip for Now</button>
                <button onClick={handleLinkDevice} disabled={loading || !selectedDevice} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Linking...' : 'Link Device'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
