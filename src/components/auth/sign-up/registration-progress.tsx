"use client";

import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface RegistrationProgressProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export function RegistrationProgress({
  steps,
  currentStep,
  completedSteps,
  className,
}: RegistrationProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && !isCompleted && "border-primary bg-primary/10 text-primary",
                    isUpcoming && "border-muted-foreground/30 bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className={cn("h-5 w-5", isCurrent && "fill-current")} />
                  )}
                </div>
                
                {/* Step Info */}
                <div className="mt-2 text-center min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate max-w-[120px]",
                      isCompleted && "text-primary",
                      isCurrent && !isCompleted && "text-primary",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 relative">
                  <div className="h-0.5 bg-muted-foreground/20 relative">
                    <div
                      className={cn(
                        "h-0.5 bg-primary transition-all duration-500",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                  <ChevronRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((completedSteps.length + (currentStepIndex >= 0 ? 0.5 : 0)) / steps.length) * 100}%`,
          }}
        />
      </div>
      
      {/* Progress Text */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(((completedSteps.length + (currentStepIndex >= 0 ? 0.5 : 0)) / steps.length) * 100)}% Complete
        </span>
      </div>
    </div>
  );
}