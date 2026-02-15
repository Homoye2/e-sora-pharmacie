import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { authService } from '../services/api'
import {  Eye, EyeOff, Loader2 } from 'lucide-react'
import logo from '../assets/e_sora.png'
export const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authService.login(formData.email, formData.password)
      console.log("user :",response.user)
      // Vérifier que l'utilisateur est un pharmacien
      if (response.user.role !== 'pharmacien' && response.user.role !== 'employe_pharmacie') {
        setError('Accès réservé aux pharmaciens uniquement')
        return
      }

      // Stocker les tokens et les informations utilisateur
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))

      // Rediriger vers le dashboard
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      console.log("error :", error.response)
      if (error.response?.status === 401) {
        setError('Email ou mot de passe incorrect')
      } else if (error.response?.data?.non_field_errors) {
        // Gérer les erreurs de validation du serializer
        const errors = error.response.data.non_field_errors
        if (Array.isArray(errors) && errors.length > 0) {
          setError(errors[0])
        } else {
          setError('Erreur de connexion. Veuillez réessayer.')
        }
      } else if (error.response?.data?.message) {
        console.log("error :", error.response.data.message)
        setError(error.response.data.message)
      } else if (error.message) {
        setError(`Erreur: ${error.message}`)
      } else {
        setError('Erreur de connexion. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="md:w-[150px] w-[100px] rounded-full">
              <img src={logo} alt="logo-e-sora" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            E-Sora Pharmacie
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connectez-vous à votre espace pharmacien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre.email@pharmacie.sn"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

         
        </CardContent>
      </Card>
    </div>
  )
}