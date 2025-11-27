import { Outlet } from "react-router";
import Navbar from "~/components/Navbar";

export default function Layout() {
    return (
        <div className="bg-primary-100" >
            <Navbar />
            <Outlet />
        </div>
    );
}