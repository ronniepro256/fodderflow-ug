import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Leaf, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Login() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      navigate("/");
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-green-600 p-3 rounded-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">FodderFlow UG</h1>
          </div>
          <p className="text-gray-600">Agricultural Feed Management Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">
              Sign in to manage your livestock feed inventory and get real-time alerts
            </p>

            {/* OAuth Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In with Manus
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to FodderFlow?</span>
              </div>
            </div>

            {/* Register Link */}
            <Button
              onClick={() => navigate("/register")}
              variant="outline"
              className="w-full py-6 text-lg font-semibold rounded-lg border-2 border-gray-200 hover:border-green-600 hover:bg-green-50 transition-all duration-200"
            >
              Create Account
            </Button>

            {/* Features List */}
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Why use FodderFlow?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Real-time feed inventory tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Critical alert notifications
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Weather-based farming advice
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Works offline on your phone
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </Card>

        {/* Support Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Having trouble? Contact support at{" "}
          <a href="mailto:support@fodderflow.ug" className="text-green-600 hover:text-green-700 font-semibold">
            support@fodderflow.ug
          </a>
        </p>
      </div>
    </div>
  );
}
