export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />

            <div className="relative z-10 w-full max-w-md px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Flux<span className="text-primary">.social</span></h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">Command Center</p>
                </div>

                <div className="glass rounded-3xl p-1 overflow-hidden shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
