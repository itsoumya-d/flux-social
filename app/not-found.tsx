import Link from 'next/link'

export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">Page Not Found</h2>
            <p className="text-muted-foreground">Could not find requested resource</p>
            <Link
                href="/"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
                Return Home
            </Link>
        </div>
    )
}
