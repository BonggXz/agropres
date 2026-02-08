import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPageMain';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="w-12 h-12 animate-spin text-primary" />
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        duration={3000}
      />
      {user ? <DashboardPage user={user} /> : <LoginPage />}
    </>
  );
}

export default App;