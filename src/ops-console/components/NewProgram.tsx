import React from 'react';
import { Box, Container, Grid, Paper } from '@mui/material';
import './NewProgram.css';
import NewProgramHeader from './NewProgramHeader';
import NewProgramLocationFields from './NewProgramLocationFields';
import NewProgramPartnerFields from './NewProgramPartnerFields';
import NewProgramSetupFields from './NewProgramSetupFields';
import NewProgramTargetsActions from './NewProgramTargetsActions';
import { useNewProgramForm } from './useNewProgramForm';

const NewProgram: React.FC = () => {
  const form = useNewProgramForm();

  return (
    <Box sx={{ height: '100vh', overflowY: 'auto', m: 0, p: 0 }}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        <NewProgramHeader />
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
          <Grid container spacing={3}>
            <NewProgramPartnerFields form={form} />
            <NewProgramLocationFields form={form} />
            <NewProgramSetupFields form={form} />
            <NewProgramTargetsActions form={form} />
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default NewProgram;
