import React from 'react';
import { Crown, X } from 'lucide-react';

interface UpgradeNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const UpgradeNotification: React.FC<UpgradeNotificationProps> = ({
  isVisible,
  onClose,
  onUpgrade
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <Crown className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">
            Almost out of AI requests
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            You've used most of your daily AI requests. Upgrade to Pro for unlimited access!
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md text-xs font-medium transition-all duration-200"
            >
              <Crown size={12} />
              Upgrade
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default UpgradeNotification;