import React from 'react';
import { CssBaseline, Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/index.tsx';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
// import Header from './components/Header';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <AuthProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <Box sx={{ flexGrow: 1 }}>
                        {/* <Header /> */}
                        <AppRoutes />
                    </Box>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

// render the app
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

export default App;
