import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-professional-lg">
        <CardHeader className="text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You don't have permission to access this page.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
