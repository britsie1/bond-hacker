import { useEffect, useState } from 'react';
import { ProgressTracker } from './components/ProgressTracker';
import { Step1 } from './components/Step1';
import { Step2 } from './components/Step2';
import { Step3 } from './components/Step3';
import { cn } from './lib/utils';
import { useBondState } from './hooks/useBondState';

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
    window.scrollTo(0, 0);
  }, [currentStep]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleBack = () => setCurrentStep(Math.max(1, currentStep - 1));

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
          <div className={cn("min-w-full transition-opacity duration-500", currentStep === 1 ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <Step1 
              onNext={() => setCurrentStep(2)} 
              isNewLoan={isNewLoan} 
              setIsNewLoan={setIsNewLoan}
              inputs={inputs}
              setInputs={setInputs}
            />
          </div>
          <div className={cn("min-w-full transition-opacity duration-500", currentStep === 2 ? "opacity-100" : "opacity-0 pointer-events-none")}>
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
          <div className={cn("min-w-full transition-opacity duration-500", currentStep === 3 ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <Step3 
              onReset={() => setCurrentStep(1)}
              inputs={inputs}
              results={results}
            />
          </div>
        </div>
      </div>

      <footer className="text-center py-10 opacity-40 text-[10px] uppercase font-bold tracking-widest px-10 text-[var(--text)]">
        &copy; {new Date().getFullYear()} South African Home Loan Assistant • Built for bond hackers
      </footer>
    </div>
  );
}

export default App;
