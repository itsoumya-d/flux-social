import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
    return (
        <SignUp
            appearance={{
                baseTheme: dark,
                elements: {
                    rootBox: "w-full",
                    card: "bg-transparent border-none shadow-none w-full",
                    headerTitle: "text-2xl font-bold tracking-tight text-white",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton: "rounded-xl border-glass-border bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-300",
                    socialButtonsBlockButtonText: "text-sm",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-3 transition-all",
                    formFieldInput: "bg-white/5 border-glass-border rounded-xl focus:ring-primary/50 text-white",
                    footerActionLink: "text-primary hover:text-primary/80 transition-colors",
                    dividerLine: "bg-glass-border",
                    dividerText: "text-muted-foreground uppercase text-[10px] tracking-widest font-bold"
                }
            }}
        />
    );
}
