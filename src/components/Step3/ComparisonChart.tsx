import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label
} from 'recharts';
import { Card } from '../ui/Card';
import type { ChartEntry } from '../Step3';
import type { Strategy } from '../../utils/urlState';
import type { StrategyResult } from '../../hooks/useBondState';
import { formatCurrency } from '../../utils/formatters';

interface ComparisonChartProps {
  chartData: ChartEntry[];
  strategies: Strategy[];
  results: StrategyResult[];
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ chartData, strategies, results }) => {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-6">
        <span className="font-extrabold text-base text-[var(--text)]">Balance Over Time</span>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }}
              tickFormatter={(val) => `R${val/1000}k`}
            />
            <Tooltip 
              contentStyle={{
                borderRadius: '16px', 
                border: '2px solid var(--border)', 
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ padding: '2px 0' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [formatCurrency(Number(val)), '']}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
            
            {/* Tipping Point Reference Lines */}
            {results.map((r, idx) => {
              if (r.result.tippingPointMonth === null) return null;
              const entry = chartData.find(d => d.month >= r.result.tippingPointMonth!);
              if (!entry) return null;

              return (
                <ReferenceLine 
                  key={`tp-${r.strategy.id}`}
                  x={entry.date} 
                  stroke={r.strategy.color} 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                >
                  {idx === 0 && (
                    <Label 
                      value="Tipping Point" 
                      position="top" 
                      fill="var(--text-muted)"
                      fontSize={10} 
                      fontWeight="bold" 
                    />
                  )}
                </ReferenceLine>
              );
            })}

            {strategies.map(s => (
              <Line 
                key={s.id}
                type="monotone" 
                dataKey={s.name} 
                stroke={s.color} 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-[9px] text-[var(--text-muted)] italic leading-tight">
        * The Tipping Point is where your monthly principal payment first exceeds the interest payment.
      </p>
    </Card>
  );
};
