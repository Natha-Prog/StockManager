import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ children, roles }) {
  const { user } = useAuth()

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
