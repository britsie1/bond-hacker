import { useEffect, useState } from 'react';
import { ProgressTracker } from './components/ProgressTracker';
import { Step1 } from './components/Step1';
import { Step2 } from './components/Step2';
import { Step3 } from './components/Step3';
import { cn } from './lib/utils';
import { useBondState } from './hooks/useBondState';
import { MessageSquare } from 'lucide-react';

function App() {
  const {
    currentStep,
    setCurrentStep,
    isDarkMode,
    setIsDarkMode,
    inputs,
    setInputs,
    strategies,
    results,
    toggleStrategy,
    updateStrategy
  } = useBondState();

  const [isNewLoan, setIsNewLoan] = useState(false);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.step) {
        setCurrentStep(event.state.step);
      } else {
        setCurrentStep(1);
      }
    };

    if (!window.history.state || !window.history.state.step) {
      window.history.replaceState({ step: currentStep }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, setCurrentStep]);

  useEffect(() => {
    const historyStep = window.history.state?.step;
    if (historyStep !== currentStep) {
      window.history.pushState({ step: currentStep }, '');
    }
    window.scrollTo(0, 0);
  }, [currentStep]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleBack = () => {
    if (currentStep > 1) {
      // Prefer using the browser's history so the back button stack stays clean
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <ProgressTracker 
        currentStep={currentStep} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        onBack={handleBack}
      />
      
      <div className="max-w-[480px] mx-auto pt-20 px-5 text-[var(--text)] overflow-x-hidden">
        <div 
          className="flex transition-all duration-500 ease-in-out items-start" 
          style={{ transform: `translateX(-${(currentStep - 1) * 100}%)`, width: '100%' }}
        >
          <div className={cn("min-w-full transition-opacity duration-500", currentStep === 1 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
            <Step1 
              onNext={() => setCurrentStep(2)} 
              isNewLoan={isNewLoan} 
              setIsNewLoan={setIsNewLoan}
              inputs={inputs}
              setInputs={setInputs}
            />
          </div>
          <div className={cn("min-w-full transition-opacity duration-500", currentStep === 2 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
            <Step2 
              onNext={() => setCurrentStep(3)} 
              isNewLoan={isNewLoan} 
              isActive={currentStep === 2}
              inputs={inputs}
              strategies={strategies}
              results={results}
              toggleStrategy={toggleStrategy}
              updateStrategy={updateStrategy}
            />
          </div>
          <div className={cn("min-w-full transition-opacity duration-500", currentStep === 3 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
            <Step3 
              onReset={() => setCurrentStep(1)}
              inputs={inputs}
              results={results}
              strategies={strategies}
            />
          </div>
        </div>
      </div>

      <footer className="text-center pt-10 pb-28 text-[10px] uppercase font-bold tracking-widest px-10 text-[var(--text)] flex flex-col items-center gap-6">
        <a 
          href="https://github.com/britsie1/bond-hacker/discussions" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95 normal-case tracking-normal text-xs"
        >
          <MessageSquare size={16} />
          <span>Have a suggestion? Join the discussion</span>
        </a>
        <div className="flex flex-col items-center gap-2 opacity-40">
          <span>&copy; {new Date().getFullYear()} South African Home Loan Assistant • Built for bond hackers</span>
          <span className="normal-case tracking-normal opacity-70">Disclaimer: This app is for informational purposes only and does not constitute financial advice.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
