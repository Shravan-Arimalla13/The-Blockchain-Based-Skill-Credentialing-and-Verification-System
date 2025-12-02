// In client/src/components/ParticipantsModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api.js'; // Explicit extension

// --- SHADCN IMPORTS ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"; // npx shadcn@latest add scroll-area
import { Loader2, Mail, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ---

function ParticipantsModal({ event, onClose }) {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Issue State for individual buttons
    const [issueStatus, setIssueStatus] = useState({});

    useEffect(() => {
        if (event) {
            setLoading(true);
            setError(null);
            setIssueStatus({});
            
            const fetchParticipants = async () => {
                try {
                    const response = await api.get(`/events/${event._id}/participants`);
                    setParticipants(response.data);
                } catch (err) {
                    setError('Failed to fetch participants.');
                } finally {
                    setLoading(false);
                }
            };
            fetchParticipants();
        }
    }, [event]);

    const handleIssueSingle = async (participant) => {
        const { name, email } = participant;
        const { name: eventName, date: eventDate } = event;

        setIssueStatus(prev => ({ ...prev, [email]: { message: 'Issuing...', isError: false, loading: true } }));

        try {
            const response = await api.post('/issue/single', { // Ensure this matches your route
                eventName: eventName,
                eventDate: eventDate,
                studentName: name,
                studentEmail: email
            });
            setIssueStatus(prev => ({ ...prev, [email]: { message: 'Issued ✅', isError: false, loading: false } }));

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed';
            setIssueStatus(prev => ({ ...prev, [email]: { message: errorMessage, isError: true, loading: false } }));
        }
    };

    // Determine if modal is open based on 'event' prop
    const isOpen = !!event;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Event Participants</DialogTitle>
                    <DialogDescription>
                        Viewing list for <strong>{event?.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                {error ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-grow overflow-hidden border rounded-md">
                        {/* Use ScrollArea for long lists */}
                        <ScrollArea className="h-[300px] w-full">
                            {participants.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No participants have registered yet.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {participants.map((p, index) => {
                                            const status = issueStatus[p.email];
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {p.name}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {p.email}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {status ? (
                                                            <span className={`text-xs font-bold ${status.isError ? 'text-red-500' : 'text-green-600'}`}>
                                                                {status.message}
                                                            </span>
                                                        ) : (
                                                            <Button 
                                                                size="sm" 
                                                                variant="secondary"
                                                                onClick={() => handleIssueSingle(p)}
                                                            >
                                                                Issue Cert
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ParticipantsModal;