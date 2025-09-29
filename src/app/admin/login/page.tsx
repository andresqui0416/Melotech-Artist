import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@yourlabel.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access the A&R dashboard</p>
          <div className="mt-4">
            <a
              href="/submit"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              ← Back to Artist Submission Portal
            </a>
          </div>
        </div>

        <AdminLoginForm adminEmail={adminEmail} adminPassword={adminPassword} />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Demo credentials: {`${adminEmail} / ${adminPassword}`}
          </p>
        </div>
      </div>
    </div>
  );
}
