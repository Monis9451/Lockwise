import { Shield, Lock, Key, Eye, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <Layout>
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="relative inline-block mb-6">
            <Shield className="w-16 h-16 text-primary" />
            <div className="absolute inset-0 rounded-full animate-glow"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            FaceGuard Vault
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-3xl mx-auto">
            The next generation password manager with biometric security. Your face is the key.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-lg text-lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 hover:bg-white/10 text-white px-8 py-6 rounded-lg text-lg">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white/5">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex p-3 rounded-full bg-primary/20">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Create Account</h3>
                <p className="text-white/70">Sign up with your email and create a master password.</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex p-3 rounded-full bg-secondary/20">
                  <Lock className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Store Passwords</h3>
                <p className="text-white/70">Securely store all your passwords in your encrypted vault.</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex p-3 rounded-full bg-accent/20">
                  <Eye className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Face Login</h3>
                <p className="text-white/70">Access your vault using advanced facial recognition.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Secure Your Digital Life Today</h2>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-lg text-lg">
            <Link to="/signup">Get Started For Free</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;