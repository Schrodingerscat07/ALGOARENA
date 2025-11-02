'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/auth';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, Check, X, Clock } from 'lucide-react';

export default function AdminExpertRequestsPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      const userData = await getUserData(user.uid);
      if (userData?.role !== 'admin') {
        router.push('/');
        return;
      }

      await loadRequests();
      setLoading(false);
    };

    checkAdminAndLoad();
  }, [user, router]);

  const loadRequests = async () => {
    const q = query(collection(db, 'expertRequests'), orderBy('requestedAt', 'desc'));
    const snapshot = await getDocs(q);
    setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleApprove = async (requestId: string, userId: string) => {
    setProcessing(requestId);
    try {
      // Update user to Expert
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { userType: 'Expert' });

      // Update request status
      const requestRef = doc(db, 'expertRequests', requestId);
      await updateDoc(requestRef, { status: 'approved' });

      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, userId: string) => {
    setProcessing(requestId);
    try {
      // Update request status
      const requestRef = doc(db, 'expertRequests', requestId);
      await updateDoc(requestRef, { status: 'rejected' });

      // Update user to remove expertRequestSent flag
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { expertRequestSent: false });

      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary-600" />
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Expert Status Requests</h2>
        {pendingRequests.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No pending expert requests</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {request.displayName}
                      </h3>
                      <p className="text-gray-600 mb-1">{request.email}</p>
                      <p className="text-sm text-gray-500">
                        Requested: {request.requestedAt?.toDate?.()?.toLocaleString() || 'Recently'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(request.id, request.userId)}
                        isLoading={processing === request.id}
                        disabled={!!processing}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(request.id, request.userId)}
                        isLoading={processing === request.id}
                        disabled={!!processing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {requests.filter(r => r.status !== 'pending').length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request History</h2>
          <div className="space-y-3">
            {requests.filter(r => r.status !== 'pending').map((request) => (
              <Card key={request.id}>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{request.displayName}</span>
                    <span className="text-gray-600 ml-2">({request.email})</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    request.status === 'approved' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
