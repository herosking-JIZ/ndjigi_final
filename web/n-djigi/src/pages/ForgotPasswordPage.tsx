import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  Link,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import axios from 'axios';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 500,
  width: '100%',
  borderRadius: 12,
}));

const StyledForm = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

interface ForgotPasswordPageProps {}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email) {
        setError('Veuillez entrer votre adresse email.');
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Veuillez entrer une adresse email valide.');
        setIsLoading(false);
        return;
      }

      await axios.post(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, {
        email,
      });

      setIsSubmitted(true);
      setEmail('');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(
        err.response?.data?.message ||
        'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <StyledPaper elevation={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <LockResetIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Mot de passe oublié
          </Typography>
        </Box>

        {isSubmitted ? (
          // Success message
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Email envoyé avec succès
            </Alert>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Si cette adresse existe dans notre système, vous recevrez un email
              avec les instructions pour réinitialiser votre mot de passe.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Consultez votre dossier <strong>spam</strong> si vous ne voyez pas
              l'email.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/login')}
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              Retour à la connexion
            </Button>
          </Box>
        ) : (
          // Form
          <>
            <Typography
              variant="body2"
              sx={{ mb: 3, color: 'text.secondary' }}
            >
              Entrez votre adresse email pour recevoir les instructions de
              réinitialisation de votre mot de passe.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <StyledForm onSubmit={handleSubmit}>
              <TextField
                label="Adresse email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                fullWidth
                required
                variant="outlined"
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer'
                )}
              </Button>
            </StyledForm>

            {/* Back link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2">
                <Link
                  href="/login"
                  underline="hover"
                  sx={{ cursor: 'pointer', color: 'primary.main' }}
                >
                  ← Retour à la connexion
                </Link>
              </Typography>
            </Box>
          </>
        )}
      </StyledPaper>
    </StyledContainer>
  );
};

export default ForgotPasswordPage;
