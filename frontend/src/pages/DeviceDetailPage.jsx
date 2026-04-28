import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDevice, testBuzz } from '../services/api';
import { Cpu, Battery, Signal, Pill } from 'lucide-react';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevice();
  }, [id]);

  const loadDevice = async () => {
    try {
      const { data } = await getDevice(id);
      setDevice(data.device);
    } catch (error) {
      console.error('Failed to load device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestBuzz = async () => {
    try {
      await testBuzz(id);
      alert('Test buzz sent!');
    } catch (error) {
      alert('Failed to send test buzz');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!device) return <div className="text-center py-12">Device not found</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{device.deviceCode}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Device Status</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <Battery className="w-5 h-5 mr-3 text-green-500" />
              <span>Battery: {device.batteryPct}%</span>
            </div>
            <div className="flex items-center">
              <Pill className="w-5 h-5 mr-3 text-blue-500" />
              <span>Pills Remaining: {device.pillsRemaining}</span>
            </div>
            <div className="flex items-center">
              <Signal className="w-5 h-5 mr-3 text-purple-500" />
              <span>Signal: {device.signalDbm} dBm</span>
            </div>
            <div className="flex items-center">
              <Cpu className="w-5 h-5 mr-3 text-gray-500" />
              <span>Firmware: {device.firmwareVersion}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Linked Patient</h2>
          {device.patientLinks[0] ? (
            <div>
              <p className="text-lg font-semibold">{device.patientLinks[0].patient.fullName}</p>
              <p className="text-sm text-gray-600">
                Linked: {new Date(device.patientLinks[0].linkedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No patient linked</p>
          )}
          
          <div className="mt-6">
            <button
              onClick={handleTestBuzz}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Test Buzz
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Events</h2>
        <div className="space-y-2">
          {device.doseEvents.slice(0, 10).map((event) => (
            <div key={event.id} className="border-b pb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{event.eventType}</span>
                <span className="text-sm text-gray-500">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Status: {event.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
