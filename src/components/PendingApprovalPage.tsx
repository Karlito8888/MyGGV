import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import './pendingApprovalPage.css';
import { toast } from 'react-toastify';

export default function PendingApprovalPage({ session }: { session: Session }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRequestStatus = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('location_association_requests')
          .select('status')
          .eq('requester_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error checking request status:', error);
          toast.error('Failed to check your request status');
          setLoading(false);
          return;
        }
        
        if (data) {
          setStatus(data.status);
          
          // If approved, show success toast and reload the page
          if (data.status === 'approved') {
            toast.success('Your location request has been approved! Redirecting to the app...');
            setTimeout(() => window.location.reload(), 2000);
          }
          
          // If rejected, show error toast
          if (data.status === 'rejected' && status !== 'rejected') {
            toast.error('Your location request has been rejected');
          }
        }
      } catch (error) {
        console.error('Error in checkRequestStatus:', error);
        toast.error('An error occurred while checking your request status');
      } finally {
        setLoading(false);
      }
    };
    
    checkRequestStatus();
    
    // Check status periodically
    const interval = setInterval(checkRequestStatus, 30000); // Every 30 seconds
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:location_association_requests')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'location_association_requests',
          filter: `requester_id=eq.${session.user.id}`
        }, 
        (payload) => {
          setStatus(payload.new.status);
          
          // Show appropriate toast based on new status
          if (payload.new.status === 'approved') {
            toast.success('Your location request has been approved! Redirecting to the app...');
            setTimeout(() => window.location.reload(), 2000);
          } else if (payload.new.status === 'rejected') {
            toast.error('Your location request has been rejected');
          }
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [session, status]);

  if (loading) return <div className="pending-approval-page"><div className="loading">Checking your request status...</div></div>;
  
  if (status === 'rejected') {
    return (
      <div className="pending-approval-page">
        <h1 className="rejected">Request Rejected</h1>
        <p>Your location association request has been rejected.</p>
        <button onClick={() => {
          toast.info('Redirecting to location selection...');
          window.location.reload();
        }}>Try Again</button>
      </div>
    );
  }
  
  return (
    <div className="pending-approval-page">
      <h2>Pending Approval Request</h2>
      <p>Your location association request is pending approval from the primary owner.</p>
      <div className="pending-message">
        <p>This page will automatically refresh once your request is approved.</p>
      </div>
    </div>
  );
}
