import React, { useState, useEffect } from 'react'; // Assuming you use these hooks

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Creating Room..." }) => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 30);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-gray-900 animate-pulse"></div>
      
      {/* Animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-8">
        {/* Spinning loader */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-32 h-32 rounded-full border-4 border-gray-700/50 absolute"></div>
          
          {/* Spinning gradient ring */}
          <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-cyan-400 border-r-purple-400 animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full animate-pulse"></div>
          </div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-cyan-300"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
            {message}{dots}
          </h2>
          
          {/* Progress bar */}
          <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
              }}
            ></div>
          </div>

          {/* Sub text */}
          <p className="text-gray-400 text-sm animate-pulse">
            Setting up your gaming arena
          </p>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }
        
        .animate-float {
          animation: float 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;