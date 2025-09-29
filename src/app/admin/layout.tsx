"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/loading";

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Email Templates', href: '/admin/email-templates', icon: '📧' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (status === "unauthenticated" && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [status, router, isLoginPage]);

  // Clear navigating state on route change completion
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // If on login page, render children without sidebar (after all hooks above ran)
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setIsNavigating(true);
      router.push(href);
      // Reset navigation state after a short delay
      setTimeout(() => setIsNavigating(false), 100);
    }
  };

  if (status === "loading") {
    // Never render the admin layout while auth is loading on protected routes to avoid flash
    if (isLoginPage) return <>{children}</>;
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">A&R Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* User Info & Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session?.user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSigningOut(true);
                  signOut({ redirect: true, callbackUrl: "/admin/login" });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {isNavigating ? (
          <div className="min-h-screen bg-gray-100">
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                  <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-32 mt-2 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Loading message="Loading page..." />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
