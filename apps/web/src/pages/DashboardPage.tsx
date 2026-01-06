import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Warranty, Stats } from '../types';
import Navbar from '../components/Navbar';
import WarrantyCard from '../components/WarrantyCard';
import { Plus, Search, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [warrantiesData, statsData] = await Promise.all([
        api.request<Warranty[]>('/warranties'),
        api.request<Stats>('/stats')
      ]);
      setWarranties(warrantiesData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(t('dashboard.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredWarranties = warranties.filter(warranty => {
    return (
      warranty.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const COLORS = ['#10B981', '#F59E0B', '#EF4444']; 

  const pieData = stats ? [
    { name: t('dashboard.stats.active'), value: stats.active_warranties },
    { name: t('dashboard.stats.expiring'), value: stats.expiring_soon_warranties },
    { name: t('dashboard.stats.expired'), value: stats.expired_warranties }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.total')}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_warranties}</p>
               </div>

               <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.active')}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active_warranties}</p>
               </div>

               <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.expiring')}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiring_soon_warranties}</p>
               </div>

               <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.expired')}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired_warranties}</p>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center transition-colors duration-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 w-full">Répartition</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', 
                        color: theme === 'dark' ? '#f8fafc' : '#1f2937' 
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#1f2937' }}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-100 dark:border-slate-700 mb-6 p-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="w-full sm:w-1/3 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-slate-600 rounded-md py-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                placeholder={t('dashboard.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={fetchData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('dashboard.refresh')}
              </button>
            </div>
          </div>
        </div>

        {loading && warranties.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center transition-colors duration-200">
            <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">{t('dashboard.error')}</h3>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        ) : filteredWarranties.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 transition-colors duration-200">
            <Shield className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.noWarranties')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.startAdding')}</p>
            <div className="mt-6">
              <Link
                to="/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                {t('dashboard.addWarranty')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWarranties.map((warranty) => (
              <WarrantyCard key={warranty.id} warranty={warranty} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
