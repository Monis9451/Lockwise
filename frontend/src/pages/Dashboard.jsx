import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Key, Plus, Search, Settings, Shield, UserRound, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const [passwords, setPasswords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState({});
  const [newPassword, setNewPassword] = useState({
    site: '',
    email: '',
    password: '',
    URL: '',
    category: 'Personal'
  });
  const [loading, setLoading] = useState(true);
  const [editingPassword, setEditingPassword] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    fetchPasswords();
  }, []);
  
  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const response = await fetch(import.meta.env.FRONTED_URL+'/passwords', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('userId');
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch passwords');
      }
      
      const data = await response.json();
      setPasswords(data.passwords || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load passwords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredPasswords = passwords.filter(password =>
    password.site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(import.meta.env.FRONTED_URL+'/passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPassword),
      });

      if (!response.ok) {
        throw new Error('Failed to add password');
      }

      const result = await response.json();
      
      setPasswords(prev => [...prev, result]);

      setNewPassword({
        site: '',
        email: '',
        password: '',
        URL: '',
        category: 'Personal'
      });

      toast({
        title: "Password Added",
        description: `${newPassword.site} credentials have been saved.`
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add password. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditClick = (password) => {
    setEditingPassword({
      ...password,
      site: password.site,
      email: password.email,
      password: password.password,
      URL: password.URL || '',
      category: password.category
    });
    setIsEditDialogOpen(true);
  };
  
  const handleEditPassword = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(import.meta.env.FRONTED_URL+`/passwords/${editingPassword._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editingPassword),
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      const updatedPassword = await response.json();
      
      setPasswords(prev => prev.map(p => 
        p._id === updatedPassword._id ? updatedPassword : p
      ));
      
      setIsEditDialogOpen(false);
      
      toast({
        title: "Password Updated",
        description: `${updatedPassword.site} credentials have been updated.`
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteClick = (password) => {
    if (!password || !password._id) {
      toast({
        title: "Error",
        description: "Cannot delete this password (missing ID)",
        variant: "destructive",
      });
      return;
    }
    setPasswordToDelete(password);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeletePassword = async () => {
    if (!passwordToDelete || !passwordToDelete._id) {
      toast({
        title: "Error", 
        description: "Cannot delete password: ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    const passwordId = passwordToDelete._id;
    
    try {
      const response = await fetch(import.meta.env.FRONTED_URL+`/passwords/${passwordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete password: ${response.status} ${response.statusText}`);
      }
      
      setPasswords(prev => prev.filter(p => p._id !== passwordId));
      
      setIsDeleteDialogOpen(false);
      setPasswordToDelete(null);
      
      toast({
        title: "Password Deleted",
        description: `${passwordToDelete.site} credentials have been deleted.`
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete password. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch(import.meta.env.FRONTED_URL+'/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      localStorage.removeItem('userId');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout hideNav>
      <div className="min-h-screen">
        <div className="flex">
          <aside className="w-64 hidden md:block h-screen bg-cyber-dark border-r border-white/10 p-4 fixed">
            <div className="flex items-center space-x-2 mb-8">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">FaceGuard</span>
            </div>
            
            <nav className="space-y-6">
              <div>
                <h3 className="text-white/50 uppercase text-xs mb-2 px-2">Main</h3>
                <div className="space-y-1">
                  <Link to="/dashboard" className="flex items-center space-x-2 px-2 py-2 rounded-md bg-white/10">
                    <Key className="h-5 w-5" />
                    <span>Passwords</span>
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-white/50 uppercase text-xs mb-2 px-2">Categories</h3>
                <div className="space-y-1">
                  <Link to="#" className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/5 text-white/70">
                    <span>Personal</span>
                    <span className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full">
                      {passwords.filter(p => p.category === 'Personal').length}
                    </span>
                  </Link>
                  <Link to="#" className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/5 text-white/70">
                    <span>Work</span>
                    <span className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full">
                      {passwords.filter(p => p.category === 'Work').length}
                    </span>
                  </Link>
                  <Link to="#" className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/5 text-white/70">
                    <span>Social</span>
                    <span className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full">
                      {passwords.filter(p => p.category === 'Social').length}
                    </span>
                  </Link>
                </div>
              </div>
            </nav>
            
            <div className="absolute bottom-4 left-4 right-4">
              <Button 
                variant="outline" 
                className="w-full border-white/20 hover:bg-white/10"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </aside>
          
          <div className="flex-1 md:ml-64 p-4">
            <header className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Password Manager</h1>
                <p className="text-white/60">Manage your secure passwords</p>
              </div>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-1">
                      <Plus className="h-4 w-4" />
                      <span>New Password</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPassword} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="site">Site/App Name</Label>
                        <Input 
                          id="site" 
                          value={newPassword.site}
                          onChange={(e) => setNewPassword({...newPassword, site: e.target.value})}
                          required
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Username/Email</Label>
                        <Input 
                          id="email" 
                          value={newPassword.email}
                          onChange={(e) => setNewPassword({...newPassword, email: e.target.value})}
                          required
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password" 
                            type={showPassword[-1] ? "text" : "password"}
                            value={newPassword.password}
                            onChange={(e) => setNewPassword({...newPassword, password: e.target.value})}
                            required
                            className="glass-input pr-10"
                          />
                          <button 
                            type="button"
                            onClick={() => togglePasswordVisibility(-1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                          >
                            {showPassword[-1] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="URL">Website URL</Label>
                        <Input 
                          id="URL" 
                          type="url"
                          value={newPassword.URL}
                          onChange={(e) => setNewPassword({...newPassword, URL: e.target.value})}
                          placeholder="https://example.com"
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={newPassword.category}
                          onChange={(e) => setNewPassword({...newPassword, category: e.target.value})}
                          className="w-full h-10 glass-input px-3 rounded-md"
                        >
                          <option value="Personal">Personal</option>
                          <option value="Work">Work</option>
                          <option value="Social">Social</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Entertainment">Entertainment</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full">Save Password</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </header>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input 
                  className="glass-input pl-9" 
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs defaultValue="all">
              <TabsList className="bg-white/10">
                <TabsTrigger value="all">All Passwords</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="pt-4">
                {loading ? (
                  <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-white/60">Loading passwords...</p>
                  </div>
                ) : (
                <div className="grid gap-4">
                  {filteredPasswords.length > 0 ? (
                    filteredPasswords.map(password => (
                      <Card key={password._id || password.id} className="glass-card overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="font-semibold text-primary">
                                  {password.site?.charAt(0).toUpperCase() || 'P'}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium">{password.site}</h3>
                                <p className="text-sm text-white/60">{password.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Input 
                                  className="glass-input pr-10 w-48 text-sm"
                                  type={showPassword[password._id || password.id] ? "text" : "password"} 
                                  value={password.password}
                                  readOnly
                                />
                                <button 
                                  onClick={() => togglePasswordVisibility(password._id || password.id)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                                >
                                  {showPassword[password._id || password.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-white/70 hover:text-white hover:bg-white/10"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.password);
                                  toast({ description: "Password copied to clipboard" });
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                          <div className="bg-white/5 px-4 py-2 flex items-center justify-between">
                            <span className="text-xs text-white/60">
                              {password.URL ? new URL(password.URL).hostname.replace('www.', '') : 'No URL'}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                                {password.category}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                onClick={() => handleEditClick(password)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-white/70 hover:text-red-500 hover:bg-white/10"
                                onClick={() => handleDeleteClick(password)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Key className="h-12 w-12 mx-auto text-white/30 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No passwords found</h3>
                      <p className="text-white/60">
                        {searchTerm ? 'Try a different search term' : 'Add your first password to get started'}
                      </p>
                    </div>
                  )}
                </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent">
                <div className="text-center py-10">
                  <h3 className="text-xl font-medium mb-2">Coming soon</h3>
                  <p className="text-white/60">This feature is under development</p>
                </div>
              </TabsContent>
              
              <TabsContent value="favorite">
                <div className="text-center py-10">
                  <h3 className="text-xl font-medium mb-2">Coming soon</h3>
                  <p className="text-white/60">This feature is under development</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Password</DialogTitle>
          </DialogHeader>
          {editingPassword && (
            <form onSubmit={handleEditPassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-site">Site/App Name</Label>
                <Input 
                  id="edit-site" 
                  value={editingPassword.site}
                  onChange={(e) => setEditingPassword({...editingPassword, site: e.target.value})}
                  required
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Username/Email</Label>
                <Input 
                  id="edit-email" 
                  value={editingPassword.email}
                  onChange={(e) => setEditingPassword({...editingPassword, email: e.target.value})}
                  required
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="edit-password" 
                    type={showPassword['edit'] ? "text" : "password"}
                    value={editingPassword.password}
                    onChange={(e) => setEditingPassword({...editingPassword, password: e.target.value})}
                    required
                    className="glass-input pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => togglePasswordVisibility('edit')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword['edit'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-URL">Website URL</Label>
                <Input 
                  id="edit-URL" 
                  type="url"
                  value={editingPassword.URL}
                  onChange={(e) => setEditingPassword({...editingPassword, URL: e.target.value})}
                  placeholder="https://example.com"
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  value={editingPassword.category}
                  onChange={(e) => setEditingPassword({...editingPassword, category: e.target.value})}
                  className="w-full h-10 glass-input px-3 rounded-md"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Social">Social</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div className="flex space-x-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the password for {passwordToDelete?.site}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePassword}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Dashboard;