import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Monitor, 
  Palette, 
  Briefcase, 
  Heart, 
  DollarSign, 
  Sparkles,
  X,
  CheckCircle,
  Circle,
  Check
} from "lucide-react";
import { INTEREST_OPTIONS } from "../utils/constants";
import type { Interest } from "../utils/constants";

// Interest icon mapping
const interestIcons = {
  Tech: Monitor,
  Design: Palette,
  Business: Briefcase,
  Health: Heart,
  Finance: DollarSign,
  Other: Sparkles,
} as const;

interface InterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInterests: Interest[];
  defaultInterests: Interest[];
  userId: string;
  onSuccess?: (interests: Interest[]) => void;
  onError?: (error: string) => void;
}

export default function InterestModal({
  isOpen,
  onClose,
  currentInterests,
  defaultInterests,
  userId,
  onSuccess,
  onError,
}: InterestModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(currentInterests);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const updateUserInterests = useMutation(api.users.updateUserInterests);

  // Reset state when modal opens/closes or props change
  useEffect(() => {
    if (isOpen) {
      setSelectedInterests(currentInterests);
      setSetAsDefault(false);
    }
  }, [isOpen, currentInterests]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInterestToggle = (interest: Interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      onError?.("Please select at least one interest");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserInterests({
        userId,
        interests: selectedInterests,
        defaultInterests: setAsDefault ? selectedInterests : defaultInterests,
        onboardingCompleted: true,
      });

      onSuccess?.(selectedInterests);
      onClose();
    } catch (error) {
      console.error("Error updating interests:", error);
      onError?.("Failed to update interests. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Update Your Interests</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4 max-h-60 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            Select the topics you're interested in. You can choose multiple interests.
          </p>
          
          {/* Interest Options */}
          <div className="space-y-2">
            {INTEREST_OPTIONS.map((interest) => {
              const InterestIcon = interestIcons[interest];
              const isSelected = selectedInterests.includes(interest);
              
              return (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  disabled={isSaving}
                  className={`
                    w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-50 border-2 border-blue-300 text-blue-900' 
                      : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                    }
                    ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <InterestIcon className="w-5 h-5" />
                  <span className="font-medium flex-1">{interest}</span>
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Set as Default Checkbox */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  disabled={isSaving}
                  className="sr-only"
                />
                <div 
                  className={`
                    w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center
                    ${setAsDefault 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {setAsDefault && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                Set as default interests
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              This will update your default interests for future use
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0 || isSaving}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
              ${selectedInterests.length > 0 && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}