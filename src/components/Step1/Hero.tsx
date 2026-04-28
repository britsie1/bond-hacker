import React from 'react';
import { House } from 'lucide-react';

export const Hero: React.FC = () => (
  <div className="text-center py-10">
    <div className="relative w-20 h-20 mx-auto mb-6">
      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
        <House className="text-white w-10 h-10" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--surface)] rounded-full ring-1 ring-[var(--surface)] shadow-md overflow-hidden">
        <svg viewBox="0 0 749.41 499.61" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <g transform="matrix(1.9983 0 0 1.9988 -74.837 -1553.7)">
            <path fill="#000000" d="m37.451 976.39v-148.13l110.28 74.02-110.28 74.11z" />
            <path fill="#0000cc" d="m112.7 1027.3l123.8-83.34h175.98v83.34h-299.78z" />
            <path fill="#ff0000" d="m112.7 777.32h299.78v83.32h-175.98s-122.16-84.14-123.8-83.32z" />
            <path fill="#ffcc00" d="m37.451 808.57v19.69l110.28 74.02-110.28 74.11 0.001 19.68 138.9-93.79-138.9-93.71z" />
            <path fill="#009933" d="m37.451 808.57v-31.25h46.338l147.14 99.53h181.55v50.9h-181.55l-147.14 99.55h-46.339v-31.23l138.9-93.79-138.9-93.71z" />
            <path fill="#ffffff" d="m83.789 777.32h28.911l123.8 83.32h175.98v16.21h-181.55l-147.14-99.53z" />
            <path fill="#ffffff" d="m83.789 1027.3h28.911l123.8-83.34h175.98v-16.21h-181.55l-147.14 99.55z" />
          </g>
        </svg>
      </div>
    </div>
    <h1 className="text-3xl font-extrabold mb-3 leading-tight text-[var(--text)]">Let's crunch your bond numbers</h1>
    <p className="text-[var(--text-secondary)] max-w-[320px] mx-auto text-sm">
      Enter your current home loan details and we'll show you how to pay it off faster.
    </p>
    <div className="mt-4 flex items-center justify-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
       <span>Free</span>
       <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
       <a href="https://github.com/britsie1/bond-hacker" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-2">Open Source</a>
       <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
       <span>Private & On-Device</span>
    </div>
  </div>
);
