// In client/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ModeToggle } from './ModeToggle'; 
import { Button } from "./ui/button"; 
import { GraduationCap, LayoutDashboard, LogOut, UserCircle } from "lucide-react"; 

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    
                    {/* --- Logo / Brand --- */}
                    <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden md:block text-foreground">
                            CredentialChain
                        </span>
                    </Link>

                    {/* --- Right Side Actions --- */}
                    <div className="flex items-center gap-3">
                        
                        {/* 1. Dark Mode Toggle (Always Visible) */}
                        <ModeToggle />

                        {/* 2. Auth Buttons (Strictly Conditional) */}
                        {isAuthenticated && user ? (
                            // --- SHOW ONLY WHEN LOGGED IN ---
                            <>
                                <div className="hidden md:flex items-center text-sm text-muted-foreground mr-2 border-r pr-4 h-6">
                                    <UserCircle className="h-4 w-4 mr-2" />
                                    <span className="max-w-[100px] truncate">{user.name}</span>
                                </div>
                                
                                <Link to="/dashboard">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Button>
                                </Link>
                                
                                <Button onClick={handleLogout} variant="destructive" size="sm" className="gap-2">
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Button>
                            </>
                        ) : (
                            // --- SHOW ONLY WHEN LOGGED OUT ---
                            <Link to="/login">
                                <Button size="sm">Login</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;