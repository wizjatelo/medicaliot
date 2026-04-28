import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';
import { Cpu, Plus } from 'lucide-react';
import RegisterDeviceModal from '../components/RegisterDeviceModal';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const { data } = await getDevices();
      setDevices(data.devices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Devices</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Device
        </button>
      </div>

      <RegisterDeviceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadDevices}
      />

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Link key={device.id} to={`/devices/${device.id}`}>
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Cpu className="w-8 h-8 text-blue-500" />
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{device.deviceCode}</h3>
                <p className="text-sm text-gray-600 mb-2">{device.label}</p>
                <div className="text-sm text-gray-500">
                  <p>Pills: {device.pillsRemaining}</p>
                  <p>Battery: {device.batteryPct}%</p>
                  {device.patientLinks[0] && (
                    <p className="mt-2 font-semibold text-blue-600">
                      {device.patientLinks[0].patient.fullName}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
