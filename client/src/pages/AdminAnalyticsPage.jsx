// In client/src/pages/AdminAnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

// --- SHADCN IMPORTS ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <-- NEW
import { Loader2, Users, Award, Calendar } from "lucide-react";
// ---

// Simple component for a single stat card
const StatCard = ({ title, value, icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

function AdminAnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/admin/analytics');
                setData(response.data);
            } catch (err) {
                setError('Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error || !data) {
        return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error || "No data"}</AlertDescription></Alert>;
    }
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
                
                {/* --- STAT CARDS --- */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Certificates" value={data.totalCerts} icon={<Award className="h-4 w-4 text-slate-500" />} />
                    <StatCard title="Total Students" value={data.totalStudents} icon={<Users className="h-4 w-4 text-slate-500" />} />
                    <StatCard title="Total Events" value={data.totalEvents} icon={<Calendar className="h-4 w-4 text-slate-500" />} />
                </div>

                {/* --- TABBED CHARTS --- */}
                <Tabs defaultValue="certificates" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="certificates">Certificates</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                    </TabsList>

                    {/* --- CERTIFICATES TAB --- */}
                    <TabsContent value="certificates">
                        <Card>
                            <CardHeader>
                                <CardTitle>Certificates by Department</CardTitle>
                                <CardDescription>Distribution of all NFTs minted to students.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.certsByDept}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="count"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {data.certsByDept.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- STUDENTS TAB (NEW) --- */}
                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <CardTitle>Students by Department</CardTitle>
                                <CardDescription>Total student accounts in the system.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.studentsByDept}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default AdminAnalyticsPage;