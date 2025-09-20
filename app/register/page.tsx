"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Store, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function RegisterPage() {
  const [userType, setUserType] = useState<"buyer" | "supplier">("buyer")
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactPerson: "",
    phone: "",
    address: "",
    organizationType: "",
    businessRegistration: "",
    description: "",
    agreeToTerms: false,
    businessSize: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    organizationName: "",
    organizationType: "",
    businessSize: "",
    email: "",
    contactPerson: "",
    phone: "",
    businessRegistration: "",
    address: "",
    description: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: "",
    general: "",
  })
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get("type")
    if (type === "buyer" || type === "supplier") {
      setUserType(type)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    let newErrors = { ...errors, general: "" }
    // Field-level validation
    if (!formData.organizationName) newErrors.organizationName = "Required"
    else newErrors.organizationName = ""
    if (!formData.organizationType) newErrors.organizationType = "Required"
    else newErrors.organizationType = ""
    if (userType === "buyer" && !formData.businessSize) newErrors.businessSize = "Required"
    else if (userType === "buyer") newErrors.businessSize = ""
    if (!formData.email) newErrors.email = "Required"
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) newErrors.email = "Invalid email address"
    else newErrors.email = ""
    if (!formData.contactPerson) newErrors.contactPerson = "Required"
    else newErrors.contactPerson = ""
    if (!formData.phone) newErrors.phone = "Required"
    else newErrors.phone = ""
    if (!formData.businessRegistration) newErrors.businessRegistration = "Required"
    else newErrors.businessRegistration = ""
    if (!formData.address) newErrors.address = "Required"
    else newErrors.address = ""
    if (userType === "supplier" && !formData.description) newErrors.description = "Required"
    else if (userType === "supplier") newErrors.description = ""
    if (!formData.password) newErrors.password = "Required"
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    else newErrors.password = ""
    if (!formData.confirmPassword) newErrors.confirmPassword = "Required"
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    else newErrors.confirmPassword = ""
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms"
    else newErrors.agreeToTerms = ""

    // If any errors, set and return
    const hasError = Object.values(newErrors).some((v) => v)
    setErrors(newErrors)
    if (hasError) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.contactPerson,
          email: formData.email,
          password: formData.password,
          role: userType === "buyer" ? "BUYER" : "SUPPLIER",
          company: formData.organizationName,
          phone: formData.phone,
          address: formData.address,
          organizationType: formData.organizationType,
          businessRegistration: formData.businessRegistration,
          description: formData.description,
          businessSize: formData.businessSize,
        }),
      })
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        const data = await response.json()
        setErrors((prev) => ({ ...prev, general: data.error || "Registration failed. Please try again." }))
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, general: "Registration failed. Please try again." }))
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-professional-lg">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">
              {userType === "buyer"
                ? "Your organization has been registered. You can now sign in to start procurement."
                : "Your supplier application has been submitted for review. We'll contact you within 2-3 business days."}
            </p>
            <Button asChild>
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="shadow-professional-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold">Viquoe</span>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              {userType === "buyer" ? (
                <>
                  <Building2 className="h-5 w-5" />
                  Register Your Organization
                </>
              ) : (
                <>
                  <Store className="h-5 w-5" />
                  Become a Supplier
                </>
              )}
            </CardTitle>
            <CardDescription>
              {userType === "buyer"
                ? "Join Viquoe to streamline your procurement process"
                : "Apply to become a verified supplier in our network"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={userType === "buyer" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserType("buyer")}
                  className="rounded-md"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Buyer
                </Button>
                <Button
                  variant={userType === "supplier" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserType("supplier")}
                  className="rounded-md"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Supplier
                </Button>
              </div>
            </div>

            {errors.general && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    {userType === "buyer" ? "Organization Name" : "Company Name"}
                  </Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => updateFormData("organizationName", e.target.value)}
                    placeholder={userType === "buyer" ? "First Bank of Nigeria" : "ABC Supplies Ltd"}
                  />
                  {errors.organizationName && <span className="text-xs text-red-500">{errors.organizationName}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationType">
                    {userType === "buyer" ? "Organization Type" : "Business Type"}
                  </Label>
                  <Select onValueChange={(value) => updateFormData("organizationType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {userType === "buyer" ? (
                        <>
                          <SelectItem value="sme">Small/Medium Enterprise</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="local-business">Local Business</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                          <SelectItem value="government">Government Agency</SelectItem>
                          <SelectItem value="ngo">NGO</SelectItem>
                          <SelectItem value="corporate">Large Corporate</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="importer">Importer</SelectItem>
                          <SelectItem value="local-supplier">Local Supplier</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.organizationType && <span className="text-xs text-red-500">{errors.organizationType}</span>}
                </div>
              </div>

              {userType === "buyer" && (
                <div className="space-y-2">
                  <Label htmlFor="businessSize">Business Size</Label>
                  <Select onValueChange={(value) => updateFormData("businessSize", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">Micro (1-10 employees)</SelectItem>
                      <SelectItem value="small">Small (11-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-250 employees)</SelectItem>
                      <SelectItem value="large">Large (250+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.businessSize && <span className="text-xs text-red-500">{errors.businessSize}</span>}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="contact@organization.com"
                  />
                  {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => updateFormData("contactPerson", e.target.value)}
                    placeholder="John Doe"
                  />
                  {errors.contactPerson && <span className="text-xs text-red-500">{errors.contactPerson}</span>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                  {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessRegistration">Business Registration Number</Label>
                  <Input
                    id="businessRegistration"
                    value={formData.businessRegistration}
                    onChange={(e) => updateFormData("businessRegistration", e.target.value)}
                    placeholder="RC123456"
                  />
                  {errors.businessRegistration && <span className="text-xs text-red-500">{errors.businessRegistration}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Complete business address"
                />
                {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
              </div>

              {userType === "supplier" && (
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Describe your products and services"
                  />
                  {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                  />
                  {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  />
                  {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateFormData("agreeToTerms", checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
                {errors.agreeToTerms && <span className="text-xs text-red-500">{errors.agreeToTerms}</span>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : `Register as ${userType === "buyer" ? "Buyer" : "Supplier"}`}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
