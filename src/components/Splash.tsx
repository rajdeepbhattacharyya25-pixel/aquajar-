import { useEffect, useState } from 'react';

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start animation shortly after mount to trigger CSS transition
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 50);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500); // Show splash for 2.5 seconds

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center p-6 bg-surface-container-lowest min-h-screen overflow-hidden">
      {/* Center Logo & Branding Block */}
      <div className="flex flex-col items-center space-y-8 max-w-sm w-full text-center z-10">
        {/* Icon Container with Tonal Stacking */}
        <div className="relative group">
          <div className="w-24 h-24 bg-primary-fixed rounded-[2rem] flex items-center justify-center logo-glow">
            <span 
              className="material-symbols-outlined text-primary text-6xl" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              water_drop
            </span>
          </div>
          {/* Subtle decorative ring */}
          <div className="absolute inset-0 border-2 border-primary-fixed-dim rounded-[2.2rem] scale-110 opacity-20"></div>
        </div>
        
        {/* Typography Cluster */}
        <div className="space-y-3">
          <h1 className="font-headline text-[3.5rem] font-extrabold text-primary tracking-tighter leading-none">
            AquaJar
          </h1>
          <p className="font-label text-[0.875rem] font-medium text-outline tracking-[0.1em] uppercase">
            Track every jar. Track every rupee.
          </p>
        </div>
        
        {/* Visual Loading Indicator (Minimalist) */}
        <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden mt-8">
          <div 
            className="h-full bg-primary rounded-full transition-all ease-linear"
            style={{ width: `${progress}%`, transitionDuration: '2450ms' }}
          ></div>
        </div>
      </div>

      {/* Hero Decorative Asset (Background Visual) */}
      <div className="absolute bottom-24 w-full max-w-md px-12 opacity-40">
        <img 
          alt="Clear blue water ripples in a minimalist high-end studio setting with soft lighting" 
          className="w-full h-auto object-cover rounded-3xl grayscale mix-blend-multiply opacity-20" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkXyHpTyrgfU_zvou488as-hoaD4qFvId8-ZtlmLM8RZvuRHHQJhFc6Z2wjZJuwVA3tjkOzR5z4MVaYGiTXHyPLGB9-waPoxVHiVHgkbVp8tjgUXruHqnXbZqGa08acaCDR72An9p9fUdgUs95rCHUl5G-gjCX-cB7PG3FKBcuBKZiJxhrDbzW9y21uePMAnId7NNdbdFZtuhpwcUv9I1jb2LYvV1sYerThjzoMTa5zJSWkN5gqMLkjSzSn3t1IwS5Yxl3KJEeFRk"
        />
      </div>

      {/* Bottom Aqua Accent - Defined by Design System Guidelines */}
      <div className="h-64 aqua-accent-gradient pointer-events-none fixed bottom-0 left-0 right-0"></div>

      {/* Footer Branding Footprint */}
      <footer className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-10">
        <div className="flex items-center space-x-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10">
          <span className="material-symbols-outlined text-[1rem] text-primary">verified</span>
          <span className="text-[0.75rem] font-semibold text-secondary tracking-wide font-label">PROFESSIONAL GRADE LOGISTICS</span>
        </div>
      </footer>

      {/* No-Line Rule Implementation: Tonal Background Shift */}
      <div className="fixed inset-0 border-[16px] border-surface-container-low pointer-events-none opacity-50"></div>
    </main>
  );
}
