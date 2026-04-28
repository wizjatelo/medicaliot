import { useEffect, useState } from 'react';
import { getDashboardSummary, getAlerts, getDoseEvents } from '../services/api';
import { Users, Cpu, Activity, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState({ totalPatients: 0, onlineDevices: 0, todayEvents: 0 });
  const [alerts, setAlerts] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, alertsRes, eventsRes] = await Promise.all([
        getDashboardSummary(),
        getAlerts({ resolved: false }),
        getDoseEvents({ limit: 10 })
      ]);
      
      setSummary(summaryRes.data);
      setAlerts(alertsRes.data.alerts);
      setRecentEvents(eventsRes.data.events);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Patients</p>
              <p className="text-3xl font-bold">{summary.totalPatients}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Online Devices</p>
              <p className="text-3xl font-bold">{summary.onlineDevices}</p>
            </div>
            <Cpu className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Events</p>
              <p className="text-3xl font-bold">{summary.todayEvents}</p>
            </div>
            <Activity className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Active Alerts
          </h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <p className="text-gray-500">No recent events</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{event.patient?.fullName}</p>
                      <p className="text-sm text-gray-600">
                        {event.eventType} - {event.status}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
