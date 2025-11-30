// In client/src/pages/ClaimInvitePage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function ClaimInvitePage() {
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();
    const { login } = useAuth(); // Get login function from our context

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('Please create your password to activate your account.');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);

        try {
            // Call our new backend API
            const response = await api.post('/auth/claim-invite', { token, password });

            // On success, use our existing login() function to save the new token
            login(response.data.user, response.data.token);

            // Redirect to the dashboard, now logged in
            navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to activate account.');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-lg rounded-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-4">Claim Your Invite</h2>

                {message && <p className="text-gray-600 text-center mb-4">{message}</p>}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        New Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                >
                    {loading ? 'Activating...' : 'Activate Account'}
                </button>
            </form>
        </div>
    );
}

export default ClaimInvitePage;