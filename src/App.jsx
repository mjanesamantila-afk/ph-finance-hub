import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/tabs/Dashboard'
import Investment from './pages/tabs/Investment'
import Budget from './pages/tabs/Budget'
import Bills from './pages/tabs/Bills'
import Savings from './pages/tabs/Savings'
import Subscriptions from './pages/tabs/Subscriptions'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <DataProvider>
                  <Layout />
                </DataProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="budget" element={<Budget />} />
            <Route path="bills" element={<Bills />} />
            <Route path="savings" element={<Savings />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="investment" element={<Investment />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
