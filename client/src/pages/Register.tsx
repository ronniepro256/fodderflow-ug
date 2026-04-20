import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Leaf, ArrowRight, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Register() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"welcome" | "setup" | "complete">("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmName: "",
    location: "",
    animals: {
      cows: 0,
      pigs: 0,
      goats: 0,
      hens: 0,
    },
  });

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      setStep("setup");
    }
  }, [isAuthenticated, user, loading]);

  const handleRegisterClick = () => {
    setIsLoading(true);
    window.location.href = getLoginUrl();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAnimalChange = (animal: keyof typeof formData.animals, value: number) => {
    setFormData((prev) => ({
      ...prev,
      animals: {
        ...prev.animals,
        [animal]: value,
      },
    }));
  };

  const handleSetupComplete = () => {
    // Save setup data to localStorage for now
    localStorage.setItem("fodderflow_setup", JSON.stringify(formData));
    setStep("complete");
    setTimeout(() => {
      navigate("/");
    }, 2000);
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
          <p className="text-gray-600">Join Uganda's farmers managing feed smarter</p>
        </div>

        {/* Welcome Step */}
        {step === "welcome" && (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600 mb-8">
                Get started with FodderFlow in just a few minutes. Sign up to manage your livestock feed inventory.
              </p>

              {/* OAuth Register Button */}
              <Button
                onClick={handleRegisterClick}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Leaf className="w-5 h-5" />
                    Sign Up with Manus
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              {/* Login Link */}
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full py-6 text-lg font-semibold rounded-lg border-2 border-gray-200 hover:border-green-600 hover:bg-green-50 transition-all duration-200"
              >
                Sign In
              </Button>

              {/* Benefits */}
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Get started with:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Instant inventory tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Smart alert system
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Free forever plan
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
              <p className="text-xs text-gray-500 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </Card>
        )}

        {/* Setup Step */}
        {step === "setup" && (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h2>
              <p className="text-gray-600 mb-8">Let's set up your farm profile</p>

              {/* Farm Name */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Name</label>
                <input
                  type="text"
                  name="farmName"
                  placeholder="e.g., Kampala Dairy Farm"
                  value={formData.farmName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Kampala, Uganda"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Animals */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Initial Livestock Count</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "cows", label: "Cows", icon: "🐄" },
                    { key: "pigs", label: "Pigs", icon: "🐷" },
                    { key: "goats", label: "Goats", icon: "🐐" },
                    { key: "hens", label: "Hens", icon: "🐔" },
                  ].map(({ key, label, icon }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {icon} {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.animals[key as keyof typeof formData.animals]}
                        onChange={(e) =>
                          handleAnimalChange(key as keyof typeof formData.animals, parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Button */}
              <Button
                onClick={handleSetupComplete}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                Complete Setup
                <ArrowRight className="w-5 h-5" />
              </Button>

              {/* Skip Option */}
              <Button
                onClick={() => setStep("complete")}
                variant="ghost"
                className="w-full mt-3 text-gray-600 hover:text-gray-900"
              >
                Skip for now
              </Button>
            </div>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to FodderFlow!</h2>
              <p className="text-gray-600 mb-8">
                Your account is ready. Redirecting to your dashboard...
              </p>
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
            </div>
          </Card>
        )}

        {/* Support Text */}
        {step !== "complete" && (
          <p className="text-center text-sm text-gray-600 mt-6">
            Questions?{" "}
            <a href="mailto:support@fodderflow.ug" className="text-green-600 hover:text-green-700 font-semibold">
              Contact us
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
