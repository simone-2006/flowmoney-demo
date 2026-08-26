import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-700 px-3 py-1.5 text-center text-xs text-white">
        Demo  — i dati restano solo in questo browser (localStorage)
      </div>
      <Navbar />
      <main className="px-2 py-1">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
