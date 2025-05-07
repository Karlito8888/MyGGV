import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import './pendingApprovalPage.css';

export default function PendingApprovalPage({ session }: { session: Session }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRequestStatus = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('location_association_requests')
        .select('status')
        .eq('requester_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        setStatus(data.status);
        
        // If approved, reload the page to access the application
        if (data.status === 'approved') {
          window.location.reload();
        }
      }
      
      setLoading(false);
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
          if (payload.new.status === 'approved') {
            window.location.reload();
          }
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [session]);

  if (loading) return <div className="pending-approval-page"><div className="loading">Checking your request status...</div></div>;
  
  if (status === 'rejected') {
    return (
      <div className="pending-approval-page">
        <h1 className="rejected">Request Rejected</h1>
        <p>Your location association request has been rejected.</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  return (
    <div className="pending-approval-page">
      <h1>Pending Approval Request</h1>
      <p>Your location association request is pending approval from the primary owner.</p>
      <div className="pending-message">
        <p>This page will automatically refresh once your request is approved.</p>
      </div>
    </div>
  );
}
