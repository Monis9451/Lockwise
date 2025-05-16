import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Shield, Settings } from 'lucide-react';

const Layout = ({ children, hideNav }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && (
        <header className="border-b border-white/10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Lock className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">FaceGuard</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/login" className="rounded-md px-4 py-2 border border-white/20 hover:bg-white/10 transition-all">
                Login
              </Link>
              <Link to="/signup" className="rounded-md px-4 py-2 bg-primary text-white hover:bg-primary/90 transition-colors">
                Sign Up
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-grow">
        {children}
      </main>
      {!hideNav && (
        <footer className="border-t border-white/10 py-6">
          <div className="container mx-auto px-4 text-center text-white/60 text-sm">
            &copy; {new Date().getFullYear()} LockWise. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;