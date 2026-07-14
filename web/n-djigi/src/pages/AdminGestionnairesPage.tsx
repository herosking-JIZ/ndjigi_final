import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Typography,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

interface Gestionnaire {
  id_utilisateur: string;
  email: string;
  nom: string;
  prenom: string;
  phone: string;
  parkings?: Array<{
    id_parking: string;
    nom: string;
  }>;
}

interface Parking {
  id_parking: string;
  nom: string;
  adresse: string;
}

interface FormData {
  email: string;
  nom: string;
  prenom: string;
  phone: string;
  parkings_assignes: string[];
}

export const AdminGestionnairesPage: React.FC = () => {
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    nom: '',
    prenom: '',
    phone: '',
    parkings_assignes: [],
  });

  // Load gestionnaires and parkings on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load parkings for selection
      const parkingsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/parkings`
      );
      setParkings(parkingsRes.data.data || []);

      // Load existing gestionnaires (if endpoint exists)
      try {
        const gestRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/gestionnaires`
        );
        setGestionnaires(gestRes.data.data || []);
      } catch (err) {
        // Endpoint might not exist yet, that's okay
        console.warn('Could not load gestionnaires list');
      }
    } catch (err: any) {
      console.error('Load data error:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      email: '',
      nom: '',
      prenom: '',
      phone: '',
      parkings_assignes: [],
    });
    setError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParkingToggle = (parkingId: string) => {
    setFormData((prev) => ({
      ...prev,
      parkings_assignes: prev.parkings_assignes.includes(parkingId)
        ? prev.parkings_assignes.filter((id) => id !== parkingId)
        : [...prev.parkings_assignes, parkingId],
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (
      !formData.email ||
      !formData.nom ||
      !formData.prenom ||
      !formData.phone
    ) {
      setError('Tous les champs sont requis');
      return;
    }

    if (formData.parkings_assignes.length === 0) {
      setError('Au moins un parking doit être assigné');
      return;
    }

    // Validate phone format
    const phoneRegex = /^\+?\d{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/admin/gestionnaires`,
        formData
      );

      setSuccess('Gestionnaire créé avec succès');
      setGestionnaires((prev) => [...prev, response.data.data]);
      handleCloseDialog();

      // Reload after 2 seconds
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (err: any) {
      console.error('Create gestionnaire error:', err);
      setError(
        err.response?.data?.message ||
        'Erreur lors de la création du gestionnaire'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGestionnaires = gestionnaires.filter(
    (g) =>
      g.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StyledContainer maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestion des Gestionnaires
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nouveau Gestionnaire
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search */}
      <TextField
        placeholder="Rechercher par nom, prénom ou email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      {/* Loading state */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* Table */
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Prénom</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Téléphone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Parkings</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGestionnaires.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    Aucun gestionnaire trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredGestionnaires.map((gest) => (
                  <TableRow key={gest.id_utilisateur} hover>
                    <TableCell>{gest.prenom}</TableCell>
                    <TableCell>{gest.nom}</TableCell>
                    <TableCell>{gest.email}</TableCell>
                    <TableCell>{gest.phone}</TableCell>
                    <TableCell>
                      {gest.parkings?.length || 0} parking(s)
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          // TODO: Implement delete
                          console.log('Delete:', gest.id_utilisateur);
                        }}
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un nouveau gestionnaire</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Prénom"
            name="prenom"
            value={formData.prenom}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            disabled={isSubmitting}
          />

          <TextField
            label="Nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            disabled={isSubmitting}
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            disabled={isSubmitting}
          />

          <TextField
            label="Téléphone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            placeholder="+226 XX XX XX XX"
            disabled={isSubmitting}
          />

          {/* Parkings Selection */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
            Assigner des parkings
          </Typography>
          <FormGroup>
            {parkings.map((parking) => (
              <FormControlLabel
                key={parking.id_parking}
                control={
                  <Checkbox
                    checked={formData.parkings_assignes.includes(
                      parking.id_parking
                    )}
                    onChange={() => handleParkingToggle(parking.id_parking)}
                    disabled={isSubmitting}
                  />
                }
                label={`${parking.nom} (${parking.adresse})`}
              />
            ))}
          </FormGroup>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Création...
              </>
            ) : (
              'Créer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
};

export default AdminGestionnairesPage;
