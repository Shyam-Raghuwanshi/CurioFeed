import React from 'react';
import { X, ExternalLink, Copy, Check, Sparkles, Zap, Crown } from 'lucide-react';
import type { AIResponse } from '../services/aiService';

interface AIResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  featureTitle: string;
  content: AIResponse | null;
  isLoading: boolean;
  originalUrl: string;
}

const AIResultModal: React.FC<AIResultModalProps> = ({
  isOpen,
  onClose,
  title,
  featureTitle,
  content,
  isLoading,
  originalUrl
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (content?.content) {
      await navigator.clipboard.writeText(content.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{featureTitle}</h2>
              <p className="text-sm text-gray-600 line-clamp-1">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {content?.success && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
            <button
              onClick={() => window.open(originalUrl, '_blank')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium text-blue-700"
            >
              <ExternalLink size={16} />
              Original
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 mt-4 text-center">
                AI is analyzing the content...<br />
                <span className="text-sm text-gray-500">This may take a few seconds</span>
              </p>
            </div>
          )}

          {!isLoading && content?.success && (
            <div className="space-y-6">
              {/* Main Content */}
              <div className="prose prose-blue max-w-none">
                <div 
                  className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: content.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                      .replace(/^\d+\.\s/gm, '<br/>$&')
                      .replace(/^-\s/gm, '<br/>• ')
                  }}
                />
              </div>
            </div>
          )}

          {!isLoading && content && !content.success && (
            <div className="flex flex-col items-center justify-center py-12">
              {content.upgradeRequired ? (
                <>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Crown size={24} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Pro</h3>
                  <p className="text-gray-600 text-center max-w-md mb-4">
                    You've reached your daily limit of {5} AI requests. Upgrade to Pro for unlimited AI features!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // In a real app, this would open a pricing/upgrade modal
                        alert('Upgrade feature would be implemented here!');
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                    >
                      <Crown size={16} />
                      Upgrade to Pro
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
                    >
                      Maybe Later
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <X size={24} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    {content.error || 'Unable to analyze the content. Please try again.'}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by AI • Analysis generated in real-time</span>
            {content?.success && content.usageRemaining !== undefined && (
              <div className="flex items-center gap-2">
                <Zap size={12} />
                <span>{content.usageRemaining} AI requests remaining today</span>
                {content.usageRemaining <= 2 && (
                  <button
                    onClick={() => alert('Upgrade to Pro for unlimited AI requests!')}
                    className="text-purple-600 hover:text-purple-700 font-medium ml-2"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResultModal;