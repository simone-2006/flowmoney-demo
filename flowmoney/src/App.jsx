import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Spese from "./pages/Spese";
import AggiungiSpesa from "./pages/AggiungiSpesa";
import Settings from "./pages/Settings";
import ModificaSpesa from "./pages/ModificaSpesa";

function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="spese" element={<Spese />} />
                <Route path="aggiungi-spesa" element={<AggiungiSpesa />} />
                <Route path="modifica-spesa/:id" element={<ModificaSpesa />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
