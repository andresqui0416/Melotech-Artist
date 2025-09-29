import { useEffect, useCallback, useState } from 'react';

interface Submission {
  id: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  notesForTeam?: string;
  createdAt: string;
  updatedAt: string;
  artist: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    bio?: string;
  };
  tracks: Array<{
    id: string;
    title: string;
    genre?: string;
    bpm?: number;
    key?: string;
    description?: string;
    originalUrl: string;
    durationSec?: number;
  }>;
  reviews: Array<{
    id: string;
    score: number;
    internalNotes?: string;
    feedbackForArtist?: string;
    createdAt: string;
    reviewer: {
      name?: string;
    };
  }>;
}

interface UseRealtimeSSEProps {
  onNewSubmission: (submission: Submission) => void;
  onSubmissionUpdate: (submission: Submission) => void;
  onSubmissionDelete: (submissionId: string) => void;
}

export const useRealtimeSSE = ({
  onNewSubmission,
  onSubmissionUpdate,
  onSubmissionDelete,
}: UseRealtimeSSEProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onopen = () => {
      console.log('SSE connected for real-time updates');
      setIsConnected(true);
      setIsConnecting(false);
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      setIsConnecting(false);
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE event received:', data);

        switch (data.type) {
          case 'new-submission':
            onNewSubmission(data.data);
            break;
          case 'submission-updated':
            onSubmissionUpdate(data.data);
            break;
          case 'submission-deleted':
            onSubmissionDelete(data.data);
            break;
          default:
            console.log('Unknown event type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []); // Empty dependency array - only run once

  return { isConnected, isConnecting };
};
