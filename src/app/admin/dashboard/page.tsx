"use client";

import { useState, useEffect } from "react";
import { useRealtimeSSE } from "@/hooks/useRealtimeSSE";

interface Track {
  id: string;
  title: string;
  genre?: string;
  bpm?: number;
  key?: string;
  description?: string;
  originalUrl: string;
  durationSec?: number;
}

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
  tracks: Track[];
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

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    score: 5,
    internalNotes: '',
    feedbackForArtist: '',
  });
  const [newSubmissionNotification, setNewSubmissionNotification] = useState<Submission | null>(null);
 
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);


  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load effect
  useEffect(() => {
    if (initialLoading && submissions.length === 0) {
      fetchSubmissions(true);
    }
  }, []);

  // Effect for pagination and filtering changes
  useEffect(() => {
    if (!initialLoading) {
      fetchSubmissions(false);
    }
  }, [currentPage, itemsPerPage, filter, debouncedSearchTerm]);

  const fetchSubmissions = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: filter === 'ALL' ? '' : filter,
        search: debouncedSearchTerm,
      });

      const response = await fetch(`/api/admin/submissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newSubmissions = data.submissions || data;
        console.log('Fetched submissions:', newSubmissions.length);
        console.log('Total items from server:', data.total);
        console.log('Current page:', currentPage);
        
        setSubmissions(newSubmissions);
        setTotalItems(data.total || data.length || 0);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      setUpdatingStatus(submissionId);
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSubmissions(prev => prev.map(sub =>
          sub.id === submissionId ? { ...sub, status: status as any } : sub
        ));
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(prev => prev ? { ...prev, status: status as any } : null);
        }
      }
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Server-side pagination - no client-side filtering needed
  const totalPages = Math.ceil((totalItems || 0) / itemsPerPage);
  const paginatedSubmissions = submissions; // Server already sends the correct page data

  // Debug pagination
  console.log('Pagination Debug:', {
    totalItems,
    itemsPerPage,
    currentPage,
    totalPages,
    submissionsCount: submissions.length,
    paginatedCount: paginatedSubmissions.length
  });


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: 'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedSubmission(null);
      setIsModalClosing(false);
    }, 300);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Awaiting review';
      case 'IN_REVIEW': return 'Under review by A&R team';
      case 'APPROVED': return 'Approved for collaboration';
      case 'REJECTED': return 'Not selected';
      default: return 'Unknown status';
    }
  };

  const handlePlayTrack = (trackId: string) => {
    if (playingTrack === trackId) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(trackId);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const newReview = await response.json();
        
        // Update the selected submission with the new review
        setSelectedSubmission(prev => prev ? {
          ...prev,
          reviews: [...prev.reviews, newReview]
        } : null);
        
        // Also update the submissions list
        setSubmissions(prev => prev.map(sub => 
          sub.id === selectedSubmission.id 
            ? { ...sub, reviews: [...sub.reviews, newReview] }
            : sub
        ));
        
        setShowReviewForm(false);
        setReviewData({ score: 5, internalNotes: '', feedbackForArtist: '' });
        alert('Review submitted successfully!');
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  // Real-time update handlers
  const handleNewSubmission = (submission: Submission) => {
    console.log('Admin dashboard received new submission:', submission.id);
    console.log('Current submissions count:', submissions.length);
    console.log('New submission data:', submission);
    
    // Only add to submissions if we're on page 1, otherwise just show notification
    if (currentPage === 1) {
      setSubmissions(prev => {
        const newSubmissions = [submission, ...prev];
        console.log('Updated submissions count:', newSubmissions.length);
        return newSubmissions;
      });
    }
    
    setTotalItems(prev => prev + 1);
    setNewSubmissionNotification(submission);
    
    // When new submission arrives, go to page 1 to show it
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNewSubmissionNotification(null);
    }, 5000);
  };

  const handleSubmissionUpdate = (updatedSubmission: Submission) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === updatedSubmission.id ? updatedSubmission : sub
    ));
    
    // Update selected submission if it's the one being updated
    if (selectedSubmission?.id === updatedSubmission.id) {
      setSelectedSubmission(updatedSubmission);
    }
  };

  const handleSubmissionDelete = (submissionId: string) => {
    setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
    setTotalItems(prev => prev - 1);
    
    // Close modal if the deleted submission was selected
    if (selectedSubmission?.id === submissionId) {
      setSelectedSubmission(null);
    }
  };

  // Set up real-time updates via Server-Sent Events
  const { isConnected, isConnecting } = useRealtimeSSE({
    onNewSubmission: handleNewSubmission,
    onSubmissionUpdate: handleSubmissionUpdate,
    onSubmissionDelete: handleSubmissionDelete,
  });

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Page Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Music Demo Submissions</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Music Demo Submissions</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Real-time Connection Status */}
              <div className={`w-2 h-2 rounded-full ${
                isConnecting 
                  ? 'bg-yellow-500 animate-pulse' 
                  : isConnected 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {isConnecting 
                  ? 'Connecting...' 
                  : isConnected 
                    ? 'Live Updates' 
                    : 'Disconnected'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Submission Notification */}
        {newSubmissionNotification && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-slide-in-from-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">New Submission Received!</h3>
                  <p className="text-sm text-green-600">
                    {newSubmissionNotification.artist.name} submitted {newSubmissionNotification.tracks.length} track(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewSubmissionNotification(null)}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by artist name, email, or track title..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {['ALL', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status as any)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 relative">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">Loading submissions...</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <div className="flex items-center justify-center">
                        <p className="text-gray-500">No submissions found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((submission, index) => (
                    <tr
                      key={submission.id}
                      className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.artist.name}
                        </div>
                        {submission.artist.phone && (
                          <div className="text-sm text-gray-500">
                            {submission.artist.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.artist.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.tracks.length} track{submission.tracks.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.tracks.map(track => track.title).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            {submission.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {getStatusDescription(submission.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <select
                            value={submission.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateSubmissionStatus(submission.id, e.target.value);
                            }}
                            disabled={updatingStatus === submission.id}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          {updatingStatus === submission.id && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading || totalPages === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading || totalPages === 0}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    disabled={loading}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems || 0)}</span> of{' '}
                    <span className="font-medium">{totalItems || 0}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.max(0, totalPages) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={loading || totalPages === 0}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (

        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isModalClosing ? 'opacity-0' : 'opacity-100'
            }`}
          onClick={handleCloseModal}
        >
          <div
            className={`bg-white rounded-lg max-w-4xl w-full max-h-[90vh] shadow-2xl transform transition-all duration-300 ${isModalClosing
                ? 'scale-95 opacity-0'
                : 'scale-100 opacity-100'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Layout: Header, Scrollable Body, Footer */}
            <div className="flex flex-col h-[80vh]">
              {/* Modal Header - Fixed */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {selectedSubmission.artist.name}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
                {/* Artist Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Artist Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-900">{selectedSubmission.artist.email}</span>
                      </div>
                      {selectedSubmission.artist.phone && (
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <span className="ml-2 text-gray-900">{selectedSubmission.artist.phone}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <div className="ml-2 inline-flex flex-col">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                            {selectedSubmission.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {getStatusDescription(selectedSubmission.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Submitted:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(selectedSubmission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(selectedSubmission.artist.instagram || selectedSubmission.artist.soundcloud || selectedSubmission.artist.spotify) && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h4>
                      <div className="space-y-2">
                        {selectedSubmission.artist.instagram && (
                          <a
                            href={selectedSubmission.artist.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-800"
                          >
                            Instagram
                          </a>
                        )}
                        {selectedSubmission.artist.soundcloud && (
                          <a
                            href={selectedSubmission.artist.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-orange-600 hover:text-orange-800"
                          >
                            SoundCloud
                          </a>
                        )}
                        {selectedSubmission.artist.spotify && (
                          <a
                            href={selectedSubmission.artist.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-green-600 hover:text-green-800"
                          >
                            Spotify
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {selectedSubmission.artist.bio && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-700">{selectedSubmission.artist.bio}</p>
                  </div>
                )}

              {/* Tracks */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Tracks</h4>
                <div className="space-y-4">
                  {selectedSubmission.tracks.map((track) => (
                    <div key={track.id} className="border rounded-lg p-4">
                      <div className="flex gap-4">
                        {/* Track Info - Left Side */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{track.title}</h5>
                            <button 
                              onClick={() => handlePlayTrack(track.id)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                playingTrack === track.id 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {playingTrack === track.id ? 'Stop' : 'Play'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            {track.genre && <span>Genre: {track.genre}</span>}
                            {track.bpm && <span>BPM: {track.bpm}</span>}
                            {track.key && <span>Key: {track.key}</span>}
                          </div>
                          {track.description && (
                            <p className="text-sm text-gray-700">{track.description}</p>
                          )}
                        </div>
                        
                        {/* Audio Player - Right Side */}
                        <div className="w-80 flex-shrink-0">
                          {playingTrack === track.id && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <audio 
                                controls 
                                className="w-full"
                                src={track.originalUrl}
                                onEnded={() => setPlayingTrack(null)}
                              >
                                Your browser does not support the audio element.
                              </audio>
                              <div className="mt-2 text-xs text-gray-500 text-center">
                                {track.durationSec ? `${Math.floor(track.durationSec / 60)}:${(track.durationSec % 60).toString().padStart(2, '0')}` : 'Duration unknown'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

                {/* Reviews */}
                {selectedSubmission.reviews.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h4>
                    <div className="space-y-4">
                      {selectedSubmission.reviews.map((review) => (
                        <div key={review.id} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {review.reviewer.name || 'Anonymous'}
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              Score: {review.score}/10
                            </span>
                          </div>
                          {review.internalNotes && (
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Notes:</strong> {review.internalNotes}
                            </p>
                          )}
                          {review.feedbackForArtist && (
                            <p className="text-sm text-gray-700">
                              <strong>Feedback:</strong> {review.feedbackForArtist}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Review Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Add Review</h4>
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      {showReviewForm ? 'Cancel' : 'Add Review'}
                    </button>
                  </div>

                  {showReviewForm && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Score (1-10)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={reviewData.score}
                            onChange={(e) => setReviewData(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1 (Poor)</span>
                            <span className="font-medium text-blue-600">{reviewData.score}/10</span>
                            <span>10 (Excellent)</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Internal Notes (for team only)
                          </label>
                          <textarea
                            value={reviewData.internalNotes}
                            onChange={(e) => setReviewData(prev => ({ ...prev, internalNotes: e.target.value }))}
                            placeholder="Internal notes for the A&R team..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feedback for Artist
                          </label>
                          <textarea
                            value={reviewData.feedbackForArtist}
                            onChange={(e) => setReviewData(prev => ({ ...prev, feedbackForArtist: e.target.value }))}
                            placeholder="Feedback to share with the artist..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setShowReviewForm(false)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSubmitReview}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Submit Review
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex justify-end items-center space-x-4 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <select
                  value={selectedSubmission.status}
                  onChange={(e) => updateSubmissionStatus(selectedSubmission.id, e.target.value)}
                  disabled={updatingStatus === selectedSubmission.id}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                {updatingStatus === selectedSubmission.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600"></div>
                )}
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}