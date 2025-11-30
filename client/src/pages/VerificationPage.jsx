// In client/src/pages/VerificationPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext'; // Import useAuth to check for admin

// --- SHADCN IMPORTS ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
// ---

// --- CertificateDetails Component (Renders the result card) ---
const CertificateDetails = ({ cert, onRevokeSuccess }) => {
    // Check if the logged-in user is an Admin/Faculty
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [revokeError, setRevokeError] = useState(null);

    const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Faculty';

    const handleRevoke = async () => {
        if (!window.confirm('Are you sure you want to permanently revoke this certificate? This action is irreversible.')) {
            return;
        }
        setIsLoading(true);
        setRevokeError(null);
        try {
            await api.post('/certificates/revoke', { certificateId: cert.certificateId });
            onRevokeSuccess(); // Tell the parent page to re-fetch data
        } catch (err) {
            setRevokeError(err.response?.data?.message || 'Failed to revoke.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className={`w-full max-w-2xl shadow-lg mt-8 border-t-8 ${
            cert.isRevoked ? 'border-red-500' : 'border-green-500'
        }`}>
            <CardHeader className="text-center">
                
                {/* --- Main Status Badge --- */}
                {cert.isRevoked ? (
                    <Badge variant="destructive" className="mb-4 text-lg mx-auto">
                        <XCircle className="h-5 w-5 mr-2" />
                        CERTIFICATE REVOKED
                    </Badge>
                ) : cert.isBlockchainVerified ? (
                    <Badge className="mb-4 bg-green-100 text-green-700 border-green-200 text-sm hover:bg-green-100 mx-auto">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verified on Blockchain
                    </Badge>
                ) : (
                    <Badge variant="destructive" className="mb-4 text-sm mx-auto">
                        <XCircle className="h-4 w-4 mr-2" />
                        Not Found on Blockchain
                    </Badge>
                )}
                
                <CardTitle className="text-2xl">{cert.eventName}</CardTitle>
                <CardDescription>Certificate of Achievement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 text-center">
                    <p className="text-sm text-slate-500">This is to certify that</p>
                    <p className="text-3xl font-bold text-slate-800">{cert.studentName}</p>
                    <p className="text-sm text-slate-500">
                        was issued this certificate by <strong>{cert.issuedBy}</strong> on {new Date(cert.issuedOn).toLocaleDateString()}.
                    </p>
                </div>

                {/* --- Admin-Only Revoke Button --- */}
                {isAdmin && !cert.isRevoked && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h4 className="font-semibold text-yellow-800 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2"/> Admin Action
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                            As an Admin/Faculty, you can permanently revoke this certificate.
                        </p>
                        <Button
                            variant="destructive"
                            className="mt-3"
                            onClick={handleRevoke}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Revoke Certificate
                        </Button>
                        {revokeError && (
                            <p className="text-sm text-red-600 mt-2">{revokeError}</p>
                        )}
                    </div>
                )}
                
                {/* --- Technical Details (Hidden by default) --- */}
                <details className="mt-6 bg-slate-50 p-3 rounded-lg border">
                    <summary className="font-medium text-sm text-slate-600 cursor-pointer">
                        Verification Details
                    </summary>
                    <div className="mt-4 space-y-2">
                        <div>
                            <Label className="text-xs">Certificate ID</Label>
                            <p className="font-mono text-xs bg-white p-2 rounded break-all">{cert.certificateId}</p>
                        </div>
                        <div>
                            <Label className="text-xs">Blockchain Hash (SHA256)</Label>
                            <p className="font-mono text-xs bg-white p-2 rounded break-all">{cert.blockchainHash}</p>
                        </div>
                        <div>
                            <Label className="text-xs">Transaction Hash (Proof)</Label>
                            <p className="font-mono text-xs bg-white p-2 rounded break-all">{cert.transactionHash || 'N/A'}</p>
                        </div>
                    </div>
                </details>
            </CardContent>
        </Card>
    );
};

// --- Main VerificationPage Component ---
function VerificationPage() {
    const { certId } = useParams(); // Get ID from URL, if present
    const navigate = useNavigate();
    
    const [inputCertId, setInputCertId] = useState(certId || '');
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // This runs if an ID is in the URL (from a QR scan)
    useEffect(() => {
        if (certId) {
            verifyId(certId);
        }
    }, [certId]); // Run when certId from URL changes

    const verifyId = async (idToVerify) => {
        if (!idToVerify) {
            setError('Please enter a Certificate ID.');
            return;
        }
        setLoading(true);
        setCertificate(null);
        setError(null);
        try {
            const response = await api.get(`/certificates/verify/${idToVerify}`);
            setCertificate(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Update the URL, which triggers the useEffect
        navigate(`/verify/${inputCertId}`);
    };

    // Callback for when admin clicks revoke
    const handleRevokeSuccess = () => {
        // Just re-run the verification to get the new "isRevoked: true" status
        verifyId(certId); 
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-2xl text-center">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Credential Verification</CardTitle>
                        <CardDescription>
                            Enter a Certificate ID to verify its authenticity on the blockchain.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex space-x-2">
                            <Input
                                type="text"
                                value={inputCertId}
                                onChange={(e) => setInputCertId(e.target.value)}
                                placeholder="CERT-..."
                                className="flex-1 text-base"
                            />
                            <Button
                                type="submit"
                                className="w-24"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* --- Results --- */}
                {loading && (
                    <div className="mt-8 flex items-center justify-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-lg">Verifying...</span>
                    </div>
                )}
                
                {error && (
                     <Alert variant="destructive" className="mt-8 text-left shadow-lg">
                         <XCircle className="h-4 w-4" />
                         <AlertTitle>Verification Failed</AlertTitle>
                         <AlertDescription>{error}</AlertDescription>
                     </Alert>
                )}

                {certificate && <CertificateDetails cert={certificate} onRevokeSuccess={handleRevokeSuccess} />}
            </div>
        </div>
    );
}

export default VerificationPage;
