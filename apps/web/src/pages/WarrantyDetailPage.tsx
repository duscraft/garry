import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Warranty } from '../types';
import Navbar from '../components/Navbar';
import { formatDate, getWarrantyStatus, getDaysRemaining } from '../utils/date';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Calendar, Tag, Store, Clock, FileText, Trash2 } from 'lucide-react';

const WarrantyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        const data = await api.request<Warranty>(`/warranties/${id}`);
        setWarranty(data);
      } catch (err: any) {
        console.error(err);
        setError('Garantie introuvable');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWarranty();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette garantie ?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api.request(`/warranties/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !warranty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800">Erreur</h3>
            <p className="text-red-600 mb-4">{error || 'Garantie introuvable'}</p>
            <Link to="/" className="text-blue-600 hover:text-blue-800">Retour au tableau de bord</Link>
          </div>
        </main>
      </div>
    );
  }

  const status = getWarrantyStatus(warranty.warranty_end_date);
  const daysRemaining = getDaysRemaining(warranty.warranty_end_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour au tableau de bord
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {warranty.product_name}
              <StatusBadge status={status} daysRemaining={daysRemaining} />
            </h1>
            <p className="text-gray-500 text-lg">{warranty.brand}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </button>
            {/* Edit functionality would go here - for now hidden as EditWarrantyPage not explicitly requested but logically needed */}
            {/* <Link
              to={`/edit/${warranty.id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link> */}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Détails de la garantie</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Informations complètes sur votre produit.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-gray-400" />
                  Catégorie
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{warranty.category}</dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Store className="w-4 h-4 mr-2 text-gray-400" />
                  Magasin
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{warranty.store}</dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Date d'achat
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(warranty.purchase_date)}</dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  Fin de garantie
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                  {formatDate(warranty.warranty_end_date)}
                  <span className="ml-2 text-gray-500 text-xs">({warranty.warranty_months} mois)</span>
                </dd>
              </div>

              {warranty.notes && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    Notes
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                    {warranty.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WarrantyDetailPage;
