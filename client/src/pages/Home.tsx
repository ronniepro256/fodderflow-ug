"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  CloudRain,
  Sun,
  Package,
  AlertTriangle,
  Beef,
  Egg,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface AnimalProfile {
  name: string;
  dailyIntake: number;
  count: number;
  currentStock: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  feedType: string;
}

interface DashboardState {
  cows: AnimalProfile;
  pigs: AnimalProfile;
  goats: AnimalProfile;
  hens: AnimalProfile;
}

const INITIAL_STATE: DashboardState = {
  cows: {
    name: "Cows",
    dailyIntake: 15,
    count: 8,
    currentStock: 450,
    icon: <Beef className="w-6 h-6" />,
    color: "#8B4513",
    bgColor: "bg-amber-50",
    feedType: "Maize Bran",
  },
  pigs: {
    name: "Pigs",
    dailyIntake: 2.5,
    count: 12,
    currentStock: 200,
    icon: <Package className="w-6 h-6" />,
    color: "#D4A574",
    bgColor: "bg-orange-50",
    feedType: "Maize Bran",
  },
  goats: {
    name: "Goats",
    dailyIntake: 1.5,
    count: 20,
    currentStock: 300,
    icon: <Package className="w-6 h-6" />,
    color: "#6B7280",
    bgColor: "bg-gray-50",
    feedType: "Silage",
  },
  hens: {
    name: "Hens",
    dailyIntake: 0.12,
    count: 100,
    currentStock: 150,
    icon: <Egg className="w-6 h-6" />,
    color: "#DC2626",
    bgColor: "bg-red-50",
    feedType: "Layers Mash",
  },
};

const WEATHER_FORECASTS = ["Rain", "Dry", "Sunny"];
const COST_PER_KG = 2500; // UGX per kg

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateDaysLeft = (stock: number, count: number, dailyIntake: number): number => {
  const totalDailyIntake = count * dailyIntake;
  return totalDailyIntake > 0 ? Math.round((stock / totalDailyIntake) * 10) / 10 : 0;
};

const getStatusBadge = (daysLeft: number): { color: string; label: string; bg: string } => {
  if (daysLeft > 7) return { color: "text-green-700", label: "Good", bg: "bg-green-100" };
  if (daysLeft >= 3) return { color: "text-yellow-700", label: "Warning", bg: "bg-yellow-100" };
  return { color: "text-red-700", label: "Critical", bg: "bg-red-100" };
};

// ============================================================================
// ANIMATED RADIAL CHART COMPONENT
// ============================================================================

interface AnimatedRadialChartProps {
  value: number;
  size?: number;
  daysLeft: number;
  status: { color: string; label: string; bg: string };
}

const AnimatedRadialChart = ({
  value,
  size = 200,
  daysLeft,
  status,
}: AnimatedRadialChartProps) => {
  const strokeWidth = Math.max(12, size * 0.08);
  const radius = size * 0.35;
  const center = size / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#baseGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="text-3xl font-bold text-gray-800">{Math.round(value)}%</div>
        <div className="text-sm text-gray-600 mt-1">{daysLeft} days left</div>
      </motion.div>

      <motion.div
        className={`px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {status.label}
      </motion.div>
    </div>
  );
};

// ============================================================================
// BENTO CARD COMPONENT
// ============================================================================

interface BentoCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

const BentoCard = ({ title, value, icon, color, className = "" }: BentoCardProps) => (
  <motion.div
    className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <motion.p
          className="text-3xl font-bold text-gray-900 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
  </motion.div>
);

// ============================================================================
// UPDATE STORE FORM MODAL
// ============================================================================

interface UpdateStoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateFormData) => void;
  animals: DashboardState;
  isLoading?: boolean;
}

interface UpdateFormData {
  animalType: keyof DashboardState;
  bagsAdded: number;
  animalCount: number;
}

const UpdateStoreForm = ({ isOpen, onClose, onSubmit, animals, isLoading }: UpdateStoreFormProps) => {
  const [formData, setFormData] = useState<UpdateFormData>({
    animalType: "cows",
    bagsAdded: 0,
    animalCount: animals.cows.count,
  });

  const selectedAnimal = animals[formData.animalType];
  const kgAdded = formData.bagsAdded * 50;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      animalType: "cows",
      bagsAdded: 0,
      animalCount: animals.cows.count,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Update Feed Store
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Animal Type
            </label>
            <select
              value={formData.animalType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  animalType: e.target.value as keyof DashboardState,
                  animalCount: animals[e.target.value as keyof DashboardState].count,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {Object.entries(animals).map(([key, animal]) => (
                <option key={key} value={key}>
                  {animal.name} ({animal.feedType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bags Added (50kg per bag)
            </label>
            <input
              type="number"
              min="0"
              value={formData.bagsAdded}
              onChange={(e) =>
                setFormData({ ...formData, bagsAdded: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">{kgAdded}kg total</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current {selectedAnimal.name} Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.animalCount}
              onChange={(e) =>
                setFormData({ ...formData, animalCount: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Update Summary:</span>
              <br />
              Add {kgAdded}kg to {selectedAnimal.name} stock
              <br />
              Update count to {formData.animalCount}
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Store"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// WEATHER CARD COMPONENT
// ============================================================================

interface WeatherCardProps {
  forecast: string;
}

const WeatherCard = ({ forecast }: WeatherCardProps) => {
  const isRain = forecast === "Rain";
  const isDry = forecast === "Dry";

  const advice = isRain
    ? "Tip: Ensure silage and bran are covered to avoid spoilage."
    : isDry
      ? "Tip: Pasture growth is slow. Increase supplement stock by 15%."
      : "Tip: Ideal conditions for pasture growth. Monitor water availability.";

  return (
    <motion.div
      className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Local Weather</h3>
        {isRain ? (
          <CloudRain className="w-8 h-8 text-blue-500" />
        ) : isDry ? (
          <Sun className="w-8 h-8 text-yellow-500" />
        ) : (
          <Cloud className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">Forecast</p>
          <p className="text-xl font-bold text-gray-800">{forecast}</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-sm text-gray-700">{advice}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">Rain Probability</p>
          <motion.div
            className="mt-2 h-2 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isRain ? "85%" : isDry ? "15%" : "45%" }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ marginLeft: "auto", marginRight: "auto" }}
          />
          <p className="text-sm font-semibold text-gray-700 mt-1">
            {isRain ? "85%" : isDry ? "15%" : "45%"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function FodderFlowDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [animals, setAnimals] = useState<DashboardState>(INITIAL_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState("Rain");
  const [activeTab, setActiveTab] = useState("cows");

  // tRPC queries and mutations
  const { data: inventory, isLoading: inventoryLoading } = trpc.inventory.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const updateInventoryMutation = trpc.inventory.update.useMutation();

  // Load inventory from database when it arrives
  useEffect(() => {
    if (inventory && isAuthenticated) {
      const newState: DashboardState = { ...animals };
      inventory.forEach((item) => {
        const animalKey = item.animalType as keyof DashboardState;
        if (newState[animalKey]) {
          newState[animalKey] = {
            ...newState[animalKey],
            count: item.animalCount,
            currentStock: item.currentStock,
          };
        }
      });
      setAnimals(newState);
    }
  }, [inventory, isAuthenticated]);

  // Calculate metrics
  const totalLivestock = useMemo(
    () => animals.cows.count + animals.pigs.count + animals.goats.count + animals.hens.count,
    [animals]
  );

  const totalFeedStock = useMemo(
    () =>
      animals.cows.currentStock +
      animals.pigs.currentStock +
      animals.goats.currentStock +
      animals.hens.currentStock,
    [animals]
  );

  const criticalAlerts = useMemo(() => {
    let count = 0;
    Object.values(animals).forEach((animal) => {
      const daysLeft = calculateDaysLeft(animal.currentStock, animal.count, animal.dailyIntake);
      if (daysLeft < 3) count++;
    });
    return count;
  }, [animals]);

  const estimatedMonthlyCost = useMemo(
    () => Math.round(totalFeedStock * COST_PER_KG),
    [totalFeedStock]
  );

  // Handle form submission
  const handleUpdateStore = async (formData: UpdateFormData) => {
    const { animalType, bagsAdded, animalCount } = formData;
    const kgAdded = bagsAdded * 50;

    try {
      // Update local state optimistically
      setAnimals((prev) => ({
        ...prev,
        [animalType]: {
          ...prev[animalType],
          currentStock: prev[animalType].currentStock + kgAdded,
          count: animalCount,
        },
      }));

      // Persist to database
      if (isAuthenticated) {
        await updateInventoryMutation.mutateAsync({
          animalType,
          animalCount,
          currentStock: animals[animalType].currentStock + kgAdded,
        });
      }

      toast.success(`${animals[animalType].name} inventory updated successfully!`);
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to update inventory. Please try again.");
      console.error(error);
    }
  };

  // Get current animal data
  const currentAnimal = animals[activeTab as keyof DashboardState];
  const daysLeft = calculateDaysLeft(
    currentAnimal.currentStock,
    currentAnimal.count,
    currentAnimal.dailyIntake
  );
  const percentageRemaining = Math.min(100, (daysLeft / 30) * 100);
  const status = getStatusBadge(daysLeft);

  if (inventoryLoading && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your farm data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <motion.header
        className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FodderFlow UG</h1>
            <p className="text-sm text-gray-600">Agricultural Feed Management Dashboard</p>
            {isAuthenticated && user && <p className="text-xs text-gray-500 mt-1">Welcome, {user.name}</p>}
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Update Store
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bento Grid - Hero Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          <BentoCard
            title="Total Livestock"
            value={totalLivestock}
            icon={<Beef className="w-6 h-6 text-amber-600" />}
            color="bg-amber-100"
          />
          <BentoCard
            title="Total Feed Stock"
            value={`${totalFeedStock}kg`}
            icon={<Package className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <BentoCard
            title="Critical Alerts"
            value={criticalAlerts}
            icon={
              criticalAlerts > 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-green-600" />
              )
            }
            color={criticalAlerts > 0 ? "bg-red-100" : "bg-green-100"}
          />
          <BentoCard
            title="Est. Monthly Cost"
            value={`₦${(estimatedMonthlyCost / 1000).toFixed(0)}K`}
            icon={<Package className="w-6 h-6 text-purple-600" />}
            color="bg-purple-100"
          />
        </motion.div>

        {/* Species Tabs Section */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Tabs */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200 shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full rounded-t-2xl bg-gray-100 p-1">
                  {Object.entries(animals).map(([key, animal]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      {animal.icon}
                      <span className="hidden sm:inline">{animal.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Tab Contents */}
                <AnimatePresence mode="wait">
                  {Object.entries(animals).map(([key, animal]) => (
                    <TabsContent key={key} value={key} className="p-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-center">
                          <AnimatedRadialChart
                            value={percentageRemaining}
                            size={240}
                            daysLeft={daysLeft}
                            status={status}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Feed Type</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">{animal.feedType}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Daily Intake</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                              {animal.dailyIntake}kg/animal
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Animal Count</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">{animal.count}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Current Stock</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">{animal.currentStock}kg</p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Daily Consumption:</span>{" "}
                            {(animal.count * animal.dailyIntake).toFixed(2)}kg
                          </p>
                        </div>
                      </motion.div>
                    </TabsContent>
                  ))}
                </AnimatePresence>
              </Tabs>
            </Card>
          </div>

          {/* Weather & Forecast Section */}
          <div className="space-y-4">
            <WeatherCard forecast={selectedForecast} />

            <motion.div
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Simulate Forecast
              </label>
              <div className="space-y-2">
                {WEATHER_FORECASTS.map((forecast) => (
                  <button
                    key={forecast}
                    onClick={() => setSelectedForecast(forecast)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedForecast === forecast
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {forecast}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Stats Footer */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {Object.entries(animals).map(([key, animal]) => {
            const daysLeft = calculateDaysLeft(animal.currentStock, animal.count, animal.dailyIntake);
            const status = getStatusBadge(daysLeft);
            return (
              <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{animal.name}</h4>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{daysLeft}</p>
                <p className="text-xs text-gray-600">days of feed remaining</p>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Update Store Modal */}
      <UpdateStoreForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateStore}
        animals={animals}
        isLoading={updateInventoryMutation.isPending}
      />
    </div>
  );
}
