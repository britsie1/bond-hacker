import React from 'react';
import { Star, PiggyBank, ShieldCheck, Clock, Zap } from 'lucide-react';
import { Card } from '../ui/Card';

const tips = [
  { icon: PiggyBank, title: "Access Bond vs Savings", text: "Don't keep your emergency fund in a savings account. Putting it in your access bond effectively earns you ~11.75% tax-free.", color: "text-secondary", border: "border-l-secondary" },
  { icon: ShieldCheck, title: "Bond Insurance Hack", text: "Use your existing life insurance instead of the bank's bond insurance. Cede the policy to the bank and save R200 to R500/month.", color: "text-primary", border: "border-l-primary" },
  { icon: Clock, title: "90-Day Notice Rule", text: "Always give 90 days notice before cancelling your bond. Failing to do so can result in a penalty of up to 1% of balance.", color: "text-blue-500", border: "border-l-blue-500" },
  { icon: Zap, title: "Daily Interest Power", text: "Interest is calculated daily. Paying your salary into your access bond immediately reduces your balance, saving thousands.", color: "text-success", border: "border-l-success" },
];

export const ProTips: React.FC = () => (
  <div className="mt-10 space-y-4">
    <div className="flex items-center gap-2 font-extrabold text-base mb-2 px-1 text-[var(--text)]">
      <Star className="text-secondary fill-secondary w-5 h-5" />
      Pro Tips for South Africans
    </div>

    {tips.map((tip, i) => (
      <Card key={i} className={`!p-4 !mb-3 border-l-4 ${tip.border}`}>
        <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${tip.color}`}>
          <tip.icon size={16} /> {tip.title}
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {tip.text}
        </p>
      </Card>
    ))}
  </div>
);
