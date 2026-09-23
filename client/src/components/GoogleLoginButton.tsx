import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface GoogleLoginButtonProps {
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
    setError,
    setIsSubmitting
}) => {
    const { googleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname;

    const onSuccess = async (credentialResponse: CredentialResponse) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const idToken = credentialResponse.credential;
            if (!idToken) throw new Error('No credential received from Google.');

            const user = await googleLogin(idToken);

            if (from && from !== '/login') {
                navigate(from, { replace: true });
            } else {
                navigate(`/dashboard/${user.role.toLowerCase()}`, { replace: true });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to authenticate via Google.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex justify-center mt-6">
            <GoogleLogin
                onSuccess={onSuccess}
                onError={() => setError('Google Sign-In was unsuccessful. Please try again.')}
                useOneTap={false}
                shape="pill"
                size="large"
                theme="filled_black"
                text="continue_with"
                width="100%"
            />
        </div>
    );
};
