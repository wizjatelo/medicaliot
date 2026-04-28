import { useEffect, useState } from 'react';
import { getAlerts, resolveAlert } from '../services/api';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('unresolved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const { data } = await getAlerts({ resolved: filter === 'resolved' });
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      loadAlerts();
    } catch (error) {
      alert('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Alerts</h1>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-4 py-2 rounded-lg ${filter === 'unresolved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Unresolved
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg ${filter === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Resolved
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={`border-l-4 p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                    <h3 className="font-bold text-lg">{alert.title}</h3>
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  <div className="text-sm text-gray-600">
                    <p>Patient: {alert.patient?.fullName}</p>
                    <p>Device: {alert.device?.deviceCode}</p>
                    <p>Time: {new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {!alert.isResolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
