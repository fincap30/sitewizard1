import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="app-wrapper">
      <style>{`
        :root {
          --background: 222 47% 11%;
          --foreground: 210 40% 98%;
          --card: 222 47% 15%;
          --card-foreground: 210 40% 98%;
          --popover: 222 47% 15%;
          --popover-foreground: 210 40% 98%;
          --primary: 217 91% 60%;
          --primary-foreground: 222 47% 11%;
          --secondary: 217 33% 23%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217 33% 23%;
          --muted-foreground: 215 20% 65%;
          --accent: 217 91% 60%;
          --accent-foreground: 222 47% 11%;
          --destructive: 0 63% 31%;
          --destructive-foreground: 210 40% 98%;
          --border: 217 33% 23%;
          --input: 217 33% 23%;
          --ring: 217 91% 60%;
          --radius: 0.5rem;
        }
        
        body {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          min-height: 100vh;
          color: hsl(var(--foreground));
        }
        
        .app-wrapper {
          min-height: 100vh;
          background: transparent;
        }
      `}</style>
      {children}
    </div>
  );
}