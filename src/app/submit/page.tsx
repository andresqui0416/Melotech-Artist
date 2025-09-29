"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const artistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  soundcloud: z.string().url("Invalid SoundCloud URL").optional().or(z.literal("")),
  spotify: z.string().url("Invalid Spotify URL").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const trackSchema = z.object({
  title: z.string().min(1, "Track title is required"),
  genre: z.string().optional(),
  bpm: z.number().min(60).max(200).optional(),
  key: z.string().optional(),
  description: z.string().max(300, "Description must be less than 300 characters").optional(),
});

type ArtistFormData = z.infer<typeof artistSchema>;
type TrackFormData = z.infer<typeof trackSchema>;

interface Track extends TrackFormData {
  file: File;
  id: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  s3Key?: string;
  uploadStartedAt?: number;
  etaSeconds?: number;
  errorMessage?: string;
}

export default function SubmitPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
  });

  const addTrack = async (file: File) => {
    const trackId = Math.random().toString(36).substr(2, 9);
    const newTrack: Track = {
      id: trackId,
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
      genre: "",
      bpm: undefined,
      key: "",
      description: "",
      uploadProgress: 0,
      uploadStatus: 'pending',
      uploadStartedAt: undefined,
      etaSeconds: undefined,
    };
    setTracks(prev => [...prev, newTrack]);

    // Start background upload with progress and ETA so artists can continue filling the form
    try {
      updateTrack(trackId, { uploadStatus: 'uploading', uploadStartedAt: Date.now(), errorMessage: undefined });

      const presignRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { presignedUrl, key } = await presignRes.json();

      const startedAt = Date.now();
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          const elapsedSec = (Date.now() - startedAt) / 1000;
          const eta = progress > 0 ? Math.max(0, Math.round(elapsedSec * (100 / progress - 1))) : undefined;
          updateTrack(trackId, { uploadProgress: progress, etaSeconds: eta });
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          updateTrack(trackId, { uploadProgress: 100, uploadStatus: 'completed', s3Key: key, etaSeconds: 0 });
        } else {
          updateTrack(trackId, { uploadStatus: 'error', errorMessage: 'Upload failed. Please try again.' });
        }
      });
      xhr.addEventListener('error', () => {
        updateTrack(trackId, { uploadStatus: 'error', errorMessage: 'Network error during upload. Please retry.' });
      });
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    } catch (error) {
      console.error('Upload error:', error);
      updateTrack(trackId, { uploadStatus: 'error', errorMessage: 'Failed to prepare upload. Check file type/size and retry.' });
    }
  };

  const retryUpload = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    try {
      updateTrack(trackId, { uploadStatus: 'uploading', uploadProgress: 0, errorMessage: undefined, uploadStartedAt: Date.now(), etaSeconds: undefined });
      const presignRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: track.file.name,
          fileType: track.file.type,
          fileSize: track.file.size,
        }),
      });
      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { presignedUrl, key } = await presignRes.json();

      const startedAt = Date.now();
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          const elapsedSec = (Date.now() - startedAt) / 1000;
          const eta = progress > 0 ? Math.max(0, Math.round(elapsedSec * (100 / progress - 1))) : undefined;
          updateTrack(trackId, { uploadProgress: progress, etaSeconds: eta });
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          updateTrack(trackId, { uploadProgress: 100, uploadStatus: 'completed', s3Key: key, etaSeconds: 0 });
        } else {
          updateTrack(trackId, { uploadStatus: 'error', errorMessage: 'Upload failed. Please try again.' });
        }
      });
      xhr.addEventListener('error', () => {
        updateTrack(trackId, { uploadStatus: 'error', errorMessage: 'Network error during upload. Please retry.' });
      });
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', track.file.type);
      xhr.send(track.file);
    } catch (e) {
      console.error('Retry upload error:', e);
      updateTrack(trackId, { uploadStatus: 'error', errorMessage: 'Failed to prepare upload. Check file type/size and retry.' });
    }
  };

  const removeTrack = (trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const audioFiles = files.filter(file => 
      ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/x-m4a'].includes(file.type)
    );
    
    audioFiles.forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert(`File ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }
      addTrack(file);
    });
    setFormError(null);
  };

  const onSubmit = async (data: ArtistFormData) => {
    if (tracks.length === 0) {
      setFormError("Please add at least one track.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Validate uploads state before submit: all must be completed
      const anyUploading = tracks.some(t => t.uploadStatus === 'uploading' || t.uploadStatus === 'pending');
      const anyError = tracks.some(t => t.uploadStatus === 'error');
      const allCompleted = tracks.every(t => t.uploadStatus === 'completed');

      if (anyUploading) {
        setFormError('Please wait for all uploads to finish before submitting.');
        setIsSubmitting(false);
        return;
      }
      if (anyError || !allCompleted) {
        setFormError('Some tracks failed to upload. Please retry or remove failed tracks.');
        setIsSubmitting(false);
        return;
      }

      // Submit to API (stores in DB and triggers realtime)
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: data,
          tracks: tracks.map(track => ({
            title: track.title,
            genre: track.genre,
            bpm: track.bpm,
            key: track.key,
            description: track.description,
            s3Key: track.s3Key,
            fileName: track.file.name,
          })),
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        reset();
        setTracks([]);
      } else {
        setSubmitStatus('error');
        setFormError('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setFormError('Submission failed due to a network or server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your submission. We'll review your tracks and get back to you soon.
          </p>
          <button
            onClick={() => setSubmitStatus('idle')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Submit Your Demo</h1>
              <p className="text-xl text-purple-200">
                Share your music with our A&R team
              </p>
            </div>
            <div>
              <a
                href="/admin/login"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Admin Login →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Artist Information */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Artist Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    {...register("name")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your artist name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    {...register("phone")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    {...register("instagram")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://instagram.com/yourname"
                  />
                  {errors.instagram && (
                    <p className="text-red-500 text-sm mt-1">{errors.instagram.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SoundCloud
                  </label>
                  <input
                    {...register("soundcloud")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://soundcloud.com/yourname"
                  />
                  {errors.soundcloud && (
                    <p className="text-red-500 text-sm mt-1">{errors.soundcloud.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spotify
                  </label>
                  <input
                    {...register("spotify")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://open.spotify.com/artist/yourid"
                  />
                  {errors.spotify && (
                    <p className="text-red-500 text-sm mt-1">{errors.spotify.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...register("bio")}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us about yourself and your music..."
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                )}
              </div>
            </div>

            {/* Track Upload */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Tracks</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                <input
                  type="file"
                  multiple
                  accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/x-m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="track-upload"
                />
                <label
                  htmlFor="track-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Upload your tracks
                  </p>
                  <p className="text-sm text-gray-500">
                    MP3, WAV, FLAC, M4A up to 50MB each
                  </p>
                </label>
              </div>

              {tracks.map((track) => (
                <div key={track.id} className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{track.title}</h3>
                    <button
                      type="button"
                      onClick={() => removeTrack(track.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Upload Progress */}
                  {track.uploadStatus === 'uploading' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading{typeof track.etaSeconds === 'number' ? ` · ~${track.etaSeconds}s left` : ''}</span>
                        <span>{Math.round(track.uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${track.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {track.uploadStatus === 'completed' && (
                    <div className="mb-4 flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Upload completed
                    </div>
                  )}

                  {track.uploadStatus === 'error' && (
                    <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14" />
                        </svg>
                        <span className="text-sm">{track.errorMessage || 'Upload failed.'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => retryUpload(track.id)}
                        className="text-sm font-medium text-red-700 hover:text-red-900"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Track Title *
                      </label>
                      <input
                        value={track.title}
                        onChange={(e) => updateTrack(track.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Genre
                      </label>
                      <input
                        value={track.genre}
                        onChange={(e) => updateTrack(track.id, { genre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Electronic, Hip-Hop, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BPM
                      </label>
                      <input
                        type="number"
                        value={track.bpm || ''}
                        onChange={(e) => updateTrack(track.id, { bpm: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="128"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Key
                      </label>
                      <input
                        value={track.key}
                        onChange={(e) => updateTrack(track.id, { key: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="C minor, F major, etc."
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={track.description}
                      onChange={(e) => updateTrack(track.id, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tell us about this track..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  tracks.length === 0 ||
                  tracks.some(t => t.uploadStatus === 'uploading' || t.uploadStatus === 'pending' || t.uploadStatus === 'error')
                }
                className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Demo'}
              </button>

              {/* Form-level errors */}
              {formError && (
                <div className="text-center bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 text-sm w-full max-w-xl">
                  {formError}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
