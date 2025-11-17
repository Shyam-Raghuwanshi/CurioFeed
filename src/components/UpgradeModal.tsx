import { Crown, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'free' | 'blaze';
}

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'free' }: UpgradeModalProps) {
  const { user } = useUser();
  const createCheckoutSession = useAction(api.billing.createCheckoutSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgradeClick = useCallback(async () => {
    if (!user?.id) {
      setError('Please sign in to upgrade');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting upgrade process to Blaze plan...');
      
      // Create checkout session for Blaze plan
      const result = await createCheckoutSession({
        userId: user.id,
        planType: 'blaze'
      });
      
      if (result.success && result.checkoutUrl) {
        // Redirect to Autumn checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
      
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, createCheckoutSession]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Upgrade to CurioFeed Pro</h2>
                <p className="text-gray-600">Unlock unlimited AI-powered insights</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Plan Status */}
          {currentPlan === 'blaze' ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-800">You're already a Blaze subscriber!</h3>
              </div>
              <p className="text-orange-700 mt-1">
                You have access to unlimited AI features. Manage your subscription in the billing portal.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-center">Choose Your Plan</h3>
                <p className="text-gray-600 text-center">
                  Unlock unlimited AI content discovery and advanced features
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Blaze Plan Details */}
              <div className="border rounded-lg p-8 text-center">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-2 text-orange-600">CurioFeed Blaze</h4>
                  <div className="text-3xl font-bold text-orange-600 mb-2">Upgrade Now</div>
                  <p className="text-gray-600 mb-4">Unlimited AI-powered content discovery</p>
                </div>
                
                <ul className="text-left mb-6 space-y-2">
                  <li className="flex items-center">
                    <Crown className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited AI requests</span>
                  </li>
                  <li className="flex items-center">
                    <Crown className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Advanced personalization</span>
                  </li>
                  <li className="flex items-center">
                    <Crown className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Save unlimited articles</span>
                  </li>
                  <li className="flex items-center">
                    <Crown className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>

                <button
                  onClick={handleUpgradeClick}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 
                           text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      <span>Upgrade to Blaze</span>
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-gray-500 text-center text-sm mt-4">
                Secure checkout powered by Autumn. Cancel anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}