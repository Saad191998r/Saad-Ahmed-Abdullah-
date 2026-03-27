import React, { useEffect } from 'react';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500); // Show splash for 2.5 seconds
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white animate-fade-out">
      <div className="text-center animate-scale-in">
        <img 
          src="/logo.png" 
          alt="Dukkan Logo" 
          className="w-48 h-48 object-contain mb-6"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-3xl font-bold text-indigo-900">دكان</h1>
      </div>
      <style>{`
        @keyframes fade-out {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-out {
          animation: fade-out 2.5s ease-in-out forwards;
        }
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          20% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
