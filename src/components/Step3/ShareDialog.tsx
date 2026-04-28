import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Link as LinkIcon, MessageCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateShareUrl } from '../../utils/urlState';
import type { AppState } from '../../utils/urlState';

const TwitterIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const FacebookIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, appState }) => {
  const [shareType, setShareType] = useState<'app' | 'calculation'>('app');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = 'https://bondhacker.netlify.app';
  const calculationUrl = generateShareUrl(appState);
  
  const currentUrl = shareType === 'app' ? appUrl : calculationUrl;
  const shareText = shareType === 'app' 
    ? 'Check out BondHacker, an awesome tool to optimize your South African home loan!' 
    : 'Check out my BondHacker calculation and see how much I can save on my home loan!';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const socialLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[var(--surface)] w-full max-w-md rounded-3xl shadow-xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-extrabold text-[var(--text)]">Share</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex p-1 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
            <button
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                shareType === 'app' 
                  ? "bg-[var(--surface)] text-primary shadow-sm" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              onClick={() => setShareType('app')}
            >
              Share App
            </button>
            <button
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                shareType === 'calculation' 
                  ? "bg-[var(--surface)] text-primary shadow-sm" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              onClick={() => setShareType('calculation')}
            >
              Share Calculation
            </button>
          </div>

          {shareType === 'calculation' && (
            <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-500">
              <AlertTriangle className="shrink-0 w-5 h-5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 uppercase tracking-tight">Privacy Warning</p>
                <p>This link contains your personal loan details and strategies. Anyone with this link can view your exact calculation.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Copy Link</label>
            <div className="flex items-center gap-2 p-1.5 pl-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
              <span className="flex-1 text-xs text-[var(--text-secondary)] truncate">
                {currentUrl}
              </span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shrink-0"
              >
                <LinkIcon size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Share Via</label>
            <div className="grid grid-cols-4 gap-3">
              <a 
                href={socialLinks.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
              >
                <MessageCircle size={22} />
                <span className="text-[10px] font-bold">WhatsApp</span>
              </a>
              <a 
                href={socialLinks.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors"
              >
                <TwitterIcon size={22} />
                <span className="text-[10px] font-bold">Twitter</span>
              </a>
              <a 
                href={socialLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
              >
                <FacebookIcon size={22} />
                <span className="text-[10px] font-bold">Facebook</span>
              </a>
              <a 
                href={socialLinks.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors"
              >
                <LinkedinIcon size={22} />
                <span className="text-[10px] font-bold">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
