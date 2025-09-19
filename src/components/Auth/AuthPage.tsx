import React, { useState } from 'react'
import { LoginForm } from './LoginForm'

export function AuthPage() {
  const [variant, setVariant] = useState<'admin' | 'faculty'>('admin')

  return (
    <LoginForm 
      variant={variant}
      onVariantChange={setVariant}
    />
  )
}