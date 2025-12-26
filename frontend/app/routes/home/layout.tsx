import { Outlet } from "react-router";
import Navbar from "~/common/components/Navbar";

export default function Layout() {
    return (
        <div className="bg-primary-100 min-h-screen">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}