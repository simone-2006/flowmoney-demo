import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
    startRegistration,
    startAuthentication
} from "@simplewebauthn/browser";

import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Spese from "./pages/Spese";
import AggiungiSpesa from "./pages/AggiungiSpesa";
import Button from "./components/ui/Button";
import Input from "./components/ui/Input";
import Settings from "./pages/Settings";
import ModificaSpesa from "./pages/ModificaSpesa";

import { CircleDollarSign } from "lucide-react";

async function api(path, options = {}) {
    const response = await fetch(`/api/auth${path}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Richiesta fallita");
    }
    return data;
}

function App() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [error, setError] = useState("");
    const [setupOpen, setSetupOpen] = useState(false);
    const [secret, setSecret] = useState("");
    const [deviceName, setDeviceName] = useState("");

    const bypassAuth =
        import.meta.env.DEV &&
        ["1", "true", "yes"].includes(
            String(import.meta.env.VITE_DEV_BYPASS_AUTH || "").toLowerCase()
        );

    useEffect(() => {
        if (bypassAuth) {
            setAuthenticated(true);
            setLoading(false);
            return;
        }
        checkSession();
    }, [bypassAuth]);

    async function checkSession() {
        try {
            const data = await api("/me");
            if (data.authenticated) {
                setAuthenticated(true);
            }
        } catch {
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }

    async function login() {
        setError("");
        try {
            const options = await api("/login/options", { method: "POST" });
            const assertion = await startAuthentication({ optionsJSON: options });
            const result = await api("/login/verify", {
                method: "POST",
                body: JSON.stringify(assertion)
            });
            if (!result.verified) {
                throw new Error(result.error || "Accesso negato");
            }
            await checkSession();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    }

    async function registerDevice() {
        setError("");
        try {
            const options = await api("/register/options", {
                method: "POST",
                body: JSON.stringify({ secret, name: deviceName })
            });
            const credential = await startRegistration({ optionsJSON: options });
            const result = await api("/register/verify", {
                method: "POST",
                body: JSON.stringify({
                    ...credential,
                    secret,
                    name: deviceName
                })
            });
            if (!result.verified) {
                throw new Error(result.error || "Registrazione fallita");
            }
            setSecret("");
            setSetupOpen(false);
            await checkSession();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    }

    async function logout() {
        if (bypassAuth) {
            return;
        }
        await api("/logout", { method: "POST" });
        setAuthenticated(false);
    }

    if (loading) {
        return <div>Caricamento...</div>;
    }

    if (!authenticated) {
        return (
            <div className="fixed flex items-center justify-center flex-col w-full h-full bg-gray-100">
                <div className="flex items-center flex-col justify-between gap-5 py-2 px-6 bg-white rounded-2xl corner-squircle">
                    <div className="flex flex-col gap-3 items-center">
                        <CircleDollarSign className="text-green-600" size={30} />
                        <h1 className="font-bold text-3xl">Flowmoney</h1>
                        <p className="text-gray-600 text-xs">Accedi con un dispositivo autorizzato e autenticato</p>
                        <p>
                            <Button type="button" onClick={login} size="m">
                                Accedi
                            </Button>
                        </p>
                    </div>
                    <p>
                        <button
                            className="text-gray-400 text-xs"
                            type="button"
                            onClick={() => setSetupOpen((open) => !open)}
                        >

                            {!setupOpen ? "Registra dispositivo" : "Annulla"}
                        </button>
                    </p>
                    {setupOpen && (
                        <form
                            className="flex flex-col gap-2 items-center"
                            onSubmit={(event) => {
                                event.preventDefault();
                                registerDevice();
                            }}
                        >
                            <p>
                                <Input
                                    type="text"
                                    placeholder="Nome dispositivo"
                                    value={deviceName}
                                    onChange={(event) => setDeviceName(event.target.value)}
                                />
                            </p>
                            <p>
                                <Input
                                    type="password"
                                    placeholder="Setup secret"
                                    value={secret}
                                    onChange={(event) => setSecret(event.target.value)}
                                    autoComplete="off"
                                />
                            </p>
                            <Button type="submit" size="s">
                                Salva questo dispositivo
                            </Button>
                        </form>
                    )}
                    {error && (
                        <p className="text-xs text-red-600">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route element={<AppLayout onLogout={logout} />}>
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
