import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Notification } from "../../../drizzle/schema";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Queries
  const { data: notifications, refetch: refetchNotifications } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { enabled: isOpen }
  );
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isOpen,
  });

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      toast.success("All notifications marked as read");
    },
  });

  const deleteNotificationMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetchNotifications();
      toast.success("Notification deleted");
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotificationMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </DialogTitle>
            {unreadCount && unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount && unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all as read
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {showSettings ? (
          <AlertThresholdSettings onClose={() => setShowSettings(false)} />
        ) : (
          <div className="space-y-3 mt-4">
            {!notifications || notifications.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-gray-600">No notifications</p>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${getNotificationColor(
                      notification.notificationType
                    )} ${notification.isRead === 0 ? "ring-2 ring-offset-2 ring-blue-400" : ""}`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (notification.isRead === 0) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                            {notification.daysRemaining !== null && (
                              <p className="text-xs text-gray-600 mt-2">
                                Days remaining: <span className="font-bold">{notification.daysRemaining}</span>
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            disabled={deleteNotificationMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Alert Threshold Settings Component
function AlertThresholdSettings({ onClose }: { onClose: () => void }) {
  const { data: thresholds, refetch } = trpc.alertThresholds.list.useQuery();
  const updateMutation = trpc.alertThresholds.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Alert threshold updated");
    },
  });

  const [editingAnimal, setEditingAnimal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    criticalDays: 3,
    warningDays: 7,
    notifyEmail: true,
    notifyInApp: true,
  });

  const animalTypes = ["cows", "pigs", "goats", "hens"];

  const handleEditAnimal = (animalType: string) => {
    const threshold = thresholds?.find((t) => t.animalType === animalType);
    if (threshold) {
      setFormData({
        criticalDays: threshold.criticalDays,
        warningDays: threshold.warningDays,
        notifyEmail: threshold.notifyEmail === 1,
        notifyInApp: threshold.notifyInApp === 1,
      });
    }
    setEditingAnimal(animalType);
  };

  const handleSaveThreshold = () => {
    if (!editingAnimal) return;

    updateMutation.mutate({
      animalType: editingAnimal,
      ...formData,
    });

    setEditingAnimal(null);
  };

  return (
    <div className="space-y-4 mt-4">
      <h3 className="font-semibold text-gray-900">Alert Thresholds</h3>
      <p className="text-sm text-gray-600">
        Customize when you receive notifications for each animal type
      </p>

      {editingAnimal ? (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 capitalize">{editingAnimal}</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Critical Alert (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.criticalDays}
              onChange={(e) =>
                setFormData({ ...formData, criticalDays: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Alert when feed will last less than this many days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning Alert (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.warningDays}
              onChange={(e) =>
                setFormData({ ...formData, warningDays: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Alert when feed will last less than this many days
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.notifyInApp}
                onChange={(e) => setFormData({ ...formData, notifyInApp: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">In-app notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.notifyEmail}
                onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Email notifications</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveThreshold}
              disabled={updateMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Save
            </Button>
            <Button onClick={() => setEditingAnimal(null)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {animalTypes.map((animal) => {
            const threshold = thresholds?.find((t) => t.animalType === animal);
            return (
              <button
                key={animal}
                onClick={() => handleEditAnimal(animal)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <p className="font-semibold text-gray-900 capitalize">{animal}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Critical: {threshold?.criticalDays || 3} days
                </p>
                <p className="text-xs text-gray-600">Warning: {threshold?.warningDays || 7} days</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
