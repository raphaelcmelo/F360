import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    // Custom color palette
    primary: [
      '#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7',
      '#228be6', '#1c7ed6', '#1971c2', '#1864ab', '#145591'
    ],
    accent: [
      '#e6fcf5', '#c3fae8', '#96f2d7', '#63e6be', '#38d9a9',
      '#20c997', '#12b886', '#0ca678', '#099268', '#087f5b'
    ],
    success: [
      '#ebfbee', '#d3f9d8', '#b2f2bb', '#8ce99a', '#69db7c',
      '#51cf66', '#40c057', '#37b24d', '#2f9e44', '#2b8a3e'
    ],
    warning: [
      '#fff9db', '#fff3bf', '#ffec99', '#ffe066', '#ffd43b',
      '#fcc419', '#fab005', '#f59f00', '#f08c00', '#e67700'
    ],
    error: [
      '#fff5f5', '#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787',
      '#ff6b6b', '#fa5252', '#f03e3e', '#e03131', '#c92a2a'
    ]
  },
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '32px',
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
);