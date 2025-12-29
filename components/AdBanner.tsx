import React from 'react';

interface AdBannerProps {
  placement: 'sidebar' | 'chat';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className }) => {
  // 🔧 ADMOB / AD CONFIGURATION
  // 1. If using Capacitor/Cordova (Android APK): You typically use a plugin (like 'capacitor-admob') 
  //    to show native banners. Use this component to reserve visual space so the native ad 
  //    doesn't cover your app content.
  // 2. If using AdSense (Web): Paste your Google AdSense <ins> code inside the div below.
  
  // Set this to true to visualize the ad space during development. 
  // Set to false if your native ad plugin handles the layout automatically.
  const SHOW_DEBUG_PLACEHOLDER = true; 

  return (
    <div 
      className={`w-full h-[60px] bg-gray-50 border-t border-b flex flex-col items-center justify-center text-gray-400 text-[10px] select-none overflow-hidden shrink-0 ${className}`}
    >
      {SHOW_DEBUG_PLACEHOLDER && (
        <>
           <span className="font-bold text-gray-500">AD SPACE: {placement.toUpperCase()}</span>
           <span>(Place AdMob/AdSense Code Here)</span>
        </>
      )}
      
      {/* 🔧 PASTE YOUR AD CODE HERE */}
      {/* Example for Web: <ins className="adsbygoogle" ... ></ins> */}
      {/* Example for Native: <div id="admob-native-banner"></div> */}
      
    </div>
  );
};
