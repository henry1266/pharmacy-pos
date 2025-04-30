import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Grid, TextField, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion, AnimatePresence } from "framer-motion"; // ✅ 新增這行

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [particlesInit, setParticlesInit] = useState(false);
  const [formVisible, setFormVisible] = useState(true); // ✅ 控制淡出動畫

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  const particlesOptions = useMemo(() => ({
    background: { color: { value: "#000000" } },
    fpsLimit: 60,
    interactivity: { events: { onClick: { enable: false }, onHover: { enable: false } } },
    particles: {
      color: { value: ["#00ffff", "#00bfff", "#1e90ff"] },
      links: { color: "#00bfff", distance: 110, enable: true, opacity: 0.2, width: 0.8 },
      move: { direction: "top-right", enable: true, outModes: { default: "out" }, speed: 1.2 },
      number: { density: { enable: true, area: 800 }, value: 160 },
      opacity: { value: 0.4, animation: { enable: true, speed: 1, minimumValue: 0.2, sync: false } },
      shape: { type: ["circle", "triangle", "edge"] },
      size: { value: { min: 1.5, max: 3.5 }, animation: { enable: true, speed: 2, minimumValue: 1, sync: false } },
    },
    detectRetina: true,
  }), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data.token && response.data.user) {
        // ✅ 執行淡出動畫後跳轉
        setFormVisible(false); // 觸發動畫
        setTimeout(() => {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          axios.defaults.headers.common['x-auth-token'] = response.data.token;
          window.location.replace('/dashboard');
        }, 600); // 對應動畫時間
      } else {
        throw new Error('登入失敗，未收到完整的驗證資訊。');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.msg ||
        (err.response?.data?.errors?.map(e => e.msg).join(', ')) ||
        '登入失敗，請檢查您的憑證或稍後再試。';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {particlesInit && (
        <Particles
          id="tsparticles"
          options={particlesOptions}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence>
          {formVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', maxWidth: 400 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)',
                }}
              >
                <Typography variant="h4" align="center" gutterBottom sx={{ color: '#ffffff' }}>
                  POS系統
                </Typography>
                <Typography variant="subtitle1" align="center" sx={{ mb: 3, color: '#e0f7fa' }}>
                  請登入以繼續
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="電子郵件"
                        name="email"
                        type="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        InputProps={{ sx: { color: '#fff' } }}
                        InputLabelProps={{ sx: { color: '#bbb' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="密碼"
                        name="password"
                        type="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        InputProps={{ sx: { color: '#fff' } }}
                        InputLabelProps={{ sx: { color: '#bbb' } }}
                      />
                    </Grid>
                    {error && (
                      <Grid item xs={12}>
                        <Typography color="error" align="center" variant="body2">
                          {error}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 1, height: 48 }}
                      >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : '登入'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
