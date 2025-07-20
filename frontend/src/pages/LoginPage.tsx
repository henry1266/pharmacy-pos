import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authServiceV2';
import { LoginRequest } from '@pharmacy-pos/shared/types/api';
import { useTestMode } from '../testMode';

import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion, AnimatePresence } from "framer-motion";
import { Engine } from "@tsparticles/engine";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

interface Credentials extends LoginRequest {
  loginType: 'username' | 'email';
}

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credentials>({
    loginType: 'username',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'error'
  });
  const [particlesInit, setParticlesInit] = useState<boolean>(false);
  const [formVisible, setFormVisible] = useState<boolean>(true);
  
  // 使用測試模式 Hook
  const {
    isTestMode,
    isTestModeEnabled,
    toggleTestMode,
    performTestLogin,
    loading: testModeLoading
  } = useTestMode();

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
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
      move: {
        direction: "topRight" as const,
        enable: true,
        outModes: { default: "out" as const },
        speed: 1.2
      },
      number: { density: { enable: true, area: 800 }, value: 160 },
      opacity: { value: 0.4, animation: { enable: true, speed: 1, minimumValue: 0.2, sync: false } },
      shape: { type: ["circle", "triangle", "edge"] },
      size: { value: { min: 1.5, max: 3.5 }, animation: { enable: true, speed: 2, minimumValue: 1, sync: false } },
    },
    detectRetina: true,
  }), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleTestModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleTestMode(event.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (isTestMode) {
      try {
        // 使用測試模式服務進行登入
        const result = await performTestLogin();
        
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
        
        // 觸發淡出動畫然後使用 React Router 導航
        setFormVisible(false);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 600);
        
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.message || '測試模式登入失敗',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // 準備登入請求資料
      const loginData: LoginRequest = {
        password: credentials.password
      };
      
      // 根據登入類型設置用戶名或電子郵件
      if (credentials.loginType === 'username') {
        loginData.username = credentials.username;
      } else {
        loginData.email = credentials.email;
      }
      
      // 使用 authService 進行登入
      const response = await authService.login(loginData);
      const { token, user } = response;

      // 觸發淡出動畫然後使用 React Router 導航
      setFormVisible(false);
      setTimeout(() => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('loginTime', Math.floor(Date.now() / 1000).toString());
        
        // 所有用戶登入後都導向 dashboard
        navigate('/dashboard', { replace: true });
      }, 600);

    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage = error.message ?? '登入失敗，請檢查您的憑證或稍後再試。';
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
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="login-type-label" sx={{ color: '#bbb' }}>登入方式</InputLabel>
                        <Select
                          labelId="login-type-label"
                          name="loginType"
                          value={credentials.loginType}
                          onChange={handleChange}
                          disabled={loading || testModeLoading || isTestMode}
                          label="登入方式"
                          sx={{ color: '#fff' }}
                        >
                          <MenuItem value="username">用戶名</MenuItem>
                          <MenuItem value="email">電子郵件</MenuItem>
                        </Select>
                      </FormControl>
                      
                      {credentials.loginType === 'username' ? (
                        <TextField
                          fullWidth
                          label="用戶名"
                          name="username"
                          type="text"
                          value={credentials.username}
                          onChange={handleChange}
                          required={!isTestMode && credentials.loginType === 'username'}
                          disabled={loading || testModeLoading || isTestMode || credentials.loginType !== 'username'}
                          InputProps={{ sx: { color: '#fff' } }}
                          InputLabelProps={{ sx: { color: '#bbb' } }}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label="電子郵件"
                          name="email"
                          type="text"
                          value={credentials.email}
                          onChange={handleChange}
                          required={!isTestMode && credentials.loginType === 'email'}
                          disabled={loading || testModeLoading || isTestMode || credentials.loginType !== 'email'}
                          InputProps={{ sx: { color: '#fff' } }}
                          InputLabelProps={{ sx: { color: '#bbb' } }}
                          sx={{ mb: 2 }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="密碼"
                        name="password"
                        type="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required={!isTestMode}
                        disabled={loading || testModeLoading || isTestMode}
                        InputProps={{ sx: { color: '#fff' } }}
                        InputLabelProps={{ sx: { color: '#bbb' } }}
                      />
                    </Grid>
                    {isTestModeEnabled && (
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={<Checkbox checked={isTestMode} onChange={handleTestModeChange} sx={{ color: '#00bfff', '&.Mui-checked': { color: '#00ffff' } }} />}
                          label={<Typography sx={{ color: '#e0f7fa' }}>測試模式</Typography>}
                          disabled={loading || testModeLoading}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loading || testModeLoading}
                        sx={{ mt: 1, height: 48 }}
                      >
                        {(loading || testModeLoading) ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : '登入'}
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