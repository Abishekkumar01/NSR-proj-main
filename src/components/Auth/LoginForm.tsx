import React, { useState } from 'react'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface LoginFormProps {
  variant?: 'admin' | 'faculty'
  onVariantChange?: (variant: 'admin' | 'faculty') => void
}

export function LoginForm({ variant = 'faculty', onVariantChange }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password, variant)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  // No autofill to avoid exposing privileged credentials

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
            <h1 className="text-2xl font-bold text-gray-900">GA Mapper</h1>
            <p className="text-gray-600 mt-2">Mapping System</p>
          <div className="flex bg-gray-100 rounded-lg p-1 mt-4 inline-flex">
            <button
              onClick={() => onVariantChange?.('faculty')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                variant === 'faculty' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Faculty Login
            </button>
            <button
              onClick={() => onVariantChange?.('admin')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ml-1 ${
                variant === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Admin Login
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {variant === 'faculty' && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Faculty accounts are created by administrators. 
              <br />
              Please contact your admin if you need access.
            </p>
          </div>
        )}

        {variant === 'admin' && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              To add new faculty, use the Faculty Management panel after logging in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}