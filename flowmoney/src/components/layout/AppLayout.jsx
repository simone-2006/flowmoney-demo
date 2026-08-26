import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onLogout={onLogout} />
      <main className="px-2 py-1">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
