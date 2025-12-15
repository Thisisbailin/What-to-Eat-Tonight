import React from 'react';

interface AvatarProps {
  mood?: 'happy' | 'thinking' | 'talking' | 'idle';
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ mood = 'idle', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
  };

  const getGradient = () => {
    switch (mood) {
      case 'thinking': return 'from-purple-300 via-indigo-200 to-blue-200';
      case 'talking': return 'from-rose-300 via-pink-200 to-orange-100';
      case 'happy': return 'from-yellow-200 via-orange-200 to-rose-200';
      default: return 'from-primary via-secondary to-accent';
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Background Glow */}
      <div className={`absolute top-0 -left-4 w-full h-full bg-primary opacity-20 blur-2xl rounded-full animate-pulse-slow`}></div>
      
      {/* Main Bubble */}
      <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${getGradient()} shadow-inner animate-blob flex items-center justify-center transition-all duration-1000 ease-in-out`}>
        {/* Shine effect */}
        <div className="absolute top-4 left-4 w-1/3 h-1/4 bg-white opacity-40 rounded-full blur-[2px]"></div>
        
        {/* Face (Minimalist) */}
        <div className="flex flex-col items-center justify-center space-y-1 opacity-60">
           <div className="flex space-x-3">
             {mood === 'thinking' ? (
                 <>
                   <div className="w-2 h-2 bg-slate-700 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-slate-700 rounded-full animate-bounce delay-75"></div>
                 </>
             ) : (
                <>
                  <div className="w-2 h-3 bg-slate-700 rounded-full"></div>
                  <div className="w-2 h-3 bg-slate-700 rounded-full"></div>
                </>
             )}
           </div>
           {mood === 'talking' && (
              <div className="w-4 h-2 border-b-2 border-slate-700 rounded-full animate-pulse"></div>
           )}
           {mood === 'happy' && (
               <div className="w-4 h-2 border-b-2 border-slate-700 rounded-full"></div>
           )}
        </div>
      </div>
    </div>
  );
};