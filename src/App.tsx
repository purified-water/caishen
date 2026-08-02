import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login/Login'
import { Register } from './pages/Register/Register'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Budget } from './pages/Budget/Budget'
import { Transactions } from './pages/Transactions/Transactions'
import { CategoriesSettings } from './pages/settings/Categories/Categories'
import { AccountsSettings } from './pages/settings/Accounts/Accounts'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/settings/categories" element={<CategoriesSettings />} />
              <Route path="/settings/accounts" element={<AccountsSettings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
