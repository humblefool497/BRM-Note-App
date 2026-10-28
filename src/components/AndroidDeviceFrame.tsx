import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, Smartphone } from 'lucide-react';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({ children }) => {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center py-4 w-full">
      <div className="relative w-full max-w-[430px] h-[880px] max-h-[92vh] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 flex flex-col ring-1 ring-cyan-500/20">
        {/* Device Outer Edge Details */}
        <div className="absolute -left-[7px] top-28 w-[3px] h-10 bg-slate-700 rounded-l-sm" /> {/* Volume Up */}
        <div className="absolute -left-[7px] top-42 w-[3px] h-10 bg-slate-700 rounded-l-sm" /> {/* Volume Down */}
        <div className="absolute -right-[7px] top-32 w-[3px] h-14 bg-slate-700 rounded-r-sm" /> {/* Power Button */}

        {/* Screen Bezel */}
        <div className="relative w-full h-full bg-slate-950 rounded-[36px] overflow-hidden flex flex-col border border-slate-800">
          {/* Android Status Bar */}
          <div className="h-10 px-6 flex items-center justify-between text-xs text-slate-300 select-none bg-slate-950/90 z-20 shrink-0">
            {/* Clock */}
            <span className="font-semibold text-xs tracking-tight">{time}</span>

            {/* Camera Punch Hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-3.5 h-3.5 bg-black rounded-full border border-slate-800/80 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ring-1 ring-blue-500/30" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[10px] font-bold tracking-wider text-cyan-400">5G</span>
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
            {children}
          </div>

          {/* Android Navigation Gesture Bar */}
          <div className="h-5 flex items-center justify-center bg-slate-950/90 shrink-0">
            <div className="w-32 h-1 bg-slate-600/70 rounded-full hover:bg-slate-500 transition-colors cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};
