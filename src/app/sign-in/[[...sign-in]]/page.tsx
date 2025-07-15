import { SignIn } from '@clerk/nextjs'
import { Squares } from "@/components/ui/squares-background"
import { BackgroundPaths } from "@/components/ui/background-paths";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <BackgroundPaths />
      <div className="w-full max-w-md mx-auto relative z-10">
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-background border border-border shadow-xl rounded-xl",
              headerTitle: "text-foreground text-2xl font-bold",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-secondary border-border text-foreground hover:bg-secondary/80",
              socialButtonsBlockButtonText: "text-foreground",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-background border-border text-foreground placeholder:text-muted-foreground",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors shadow-sm",
              formFieldWarning: "text-destructive",
              alert: "bg-destructive/10 border-destructive/20 text-destructive",
              alertText: "text-destructive",
              footerActionText: "text-muted-foreground",
              footerActionLink: "text-primary hover:text-primary/80 font-medium underline"
            }
          }}
        />
      </div>
    </div>
  )
} 