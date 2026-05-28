import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/tabs/Dashboard'
import Investment from './pages/tabs/Investment'
import Budget from './pages/tabs/Budget'
import Savings from './pages/tabs/Savings'
import Debt from './pages/tabs/Debt'
import Account from './pages/tabs/Account'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protected app */}
          <Route
            element={
              <ProtectedRoute>
                <DataProvider>
                  <Layout />
                </DataProvider>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="spending" element={<Budget />} />
            <Route path="debt" element={<Debt />} />
            <Route path="savings" element={<Savings />} />
            <Route path="investment" element={<Investment />} />
            <Route path="account" element={<Account />} />
          </Route>

          {/* Unknown -> home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
