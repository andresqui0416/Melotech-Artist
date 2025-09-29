import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Milotech Records</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/submit"
                className="text-white hover:text-purple-200 transition-colors"
              >
                Submit Demo
              </Link>
              <Link
                href="/admin/login"
                className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Submit Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Music Demo
            </span>
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            Share your music with our A&R team. Upload multiple tracks, provide detailed information, 
            and get feedback from industry professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/submit"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition-colors shadow-lg"
            >
              Submit Your Demo
            </Link>
            <Link
              href="/admin/login"
              className="bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/30 transition-colors border border-white/30"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Platform?</h2>
          <p className="text-xl text-purple-200">
            Professional tools for artists and A&R teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Multi-Track Upload</h3>
            <p className="text-purple-200">
              Upload multiple tracks in one submission with progress tracking and format validation.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Professional Review</h3>
            <p className="text-purple-200">
              Get detailed feedback from our A&R team with scoring and constructive comments.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Email Notifications</h3>
            <p className="text-purple-200">
              Receive confirmation emails and updates on your submission status.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Submit?</h2>
          <p className="text-xl text-purple-200 mb-8">
            Join thousands of artists who have submitted their demos to our platform.
          </p>
          <Link
            href="/submit"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Start Your Submission
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-purple-200">
            <p>&copy; 2024 Milotech Records. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Demo credentials: admin@yourlabel.com / admin123
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}