import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResetPasswordPage() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) return setErr("Passwords do not match");
        setLoading(true); setErr('');
        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            setMsg("Password reset successfully!");
        } catch (error) {
            setErr(error.response?.data?.message || "Failed to reset.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    {msg ? (
                        <div className="text-center space-y-4">
                            <Alert className="bg-green-50 text-green-700 border-green-200"><AlertDescription>{msg}</AlertDescription></Alert>
                            <Link to="/login"><Button className="w-full">Go to Login</Button></Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
export default ResetPasswordPage;