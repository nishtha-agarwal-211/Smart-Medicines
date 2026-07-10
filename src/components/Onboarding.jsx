import React, { useState } from 'react';
import { Pill, Scan, Shield, ArrowRight, Sparkles } from 'lucide-react';

const steps = [
    {
        icon: <Sparkles size={48} />,
        emoji: '💊',
        title: 'Welcome to Smart Medicine',
        subtitle: 'Your AI-powered medication companion',
        description: 'Track medications, get smart reminders, detect drug interactions, and manage your health — all in one place.',
        color: 'onboarding-blue',
    },
    {
        icon: <Scan size={48} />,
        emoji: '📸',
        title: 'Scan or Add Medications',
        subtitle: 'AI-powered prescription reading',
        description: 'Take a photo of your prescription and our AI will extract medication details automatically. Or add them manually.',
        color: 'onboarding-purple',
    },
    {
        icon: <Shield size={48} />,
        emoji: '🚨',
        title: 'Stay Safe & Prepared',
        subtitle: 'Emergency profile & drug interactions',
        description: 'Set up your emergency profile with contacts, allergies, and medical conditions. We\'ll also check for dangerous drug interactions.',
        color: 'onboarding-green',
    },
];

export default function Onboarding({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <div className="onboarding-overlay">
            <div className={`onboarding-card ${step.color}`}>
                {/* Skip button */}
                <button className="onboarding-skip" onClick={handleSkip}>
                    Skip
                </button>

                {/* Step content */}
                <div className="onboarding-content" key={currentStep}>
                    <div className="onboarding-icon-wrap">
                        <span className="onboarding-emoji">{step.emoji}</span>
                    </div>
                    <h2 className="onboarding-title">{step.title}</h2>
                    <p className="onboarding-subtitle">{step.subtitle}</p>
                    <p className="onboarding-desc">{step.description}</p>
                </div>

                {/* Progress dots */}
                <div className="onboarding-dots">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`onboarding-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                {/* Action button */}
                <button className="onboarding-btn" onClick={handleNext}>
                    {isLast ? (
                        <>Get Started <ArrowRight size={18} /></>
                    ) : (
                        <>Next <ArrowRight size={18} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
