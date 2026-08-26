import { Router } from "express";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from "@simplewebauthn/server";
import {
    isoUint8Array,
    isoBase64URL
} from "@simplewebauthn/server/helpers";

import { getRp, isSetupAuthorized, isDevAuthBypass } from "../lib/config.js";
import {
    listDevices,
    getDevice,
    publicDevices,
    upsertDevice,
    deleteDevice
} from "../lib/devices.js";
import {
    readSession,
    setSession,
    clearSession,
    requireAuth
} from "../lib/session.js";
import {
    setChallenge,
    readChallenge,
    clearChallenge
} from "../lib/challenge.js";
import { rateLimit } from "../lib/rateLimit.js";

const router = Router();

const authLimiter = rateLimit({ windowMs: 60_000, max: 10, key: "auth" });
const setupLimiter = rateLimit({ windowMs: 60_000, max: 5, key: "setup" });

function toStoredDevice(registrationInfo, name) {
    const { credential, credentialDeviceType, credentialBackedUp } =
        registrationInfo;

    return {
        id: credential.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports || [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        name: name || "Dispositivo",
        createdAt: new Date().toISOString()
    };
}

router.post("/register/options", setupLimiter, async (req, res) => {
    try {
        if (!isSetupAuthorized(req.body?.secret)) {
            return res.status(403).json({
                error: "Registrazione non autorizzata"
            });
        }

        const { rpName, rpID } = getRp(req);
        const devices = await listDevices();

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: isoUint8Array.fromUTF8String("simone-user"),
            userName: "simone",
            userDisplayName: "Simone",
            attestationType: "none",
            excludeCredentials: devices.map((device) => ({
                id: device.id,
                transports: device.transports
            })),
            authenticatorSelection: {
                residentKey: "required",
                userVerification: "required"
            }
        });

        setChallenge(req, res, "registration", options.challenge);
        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/register/verify", setupLimiter, async (req, res) => {
    try {
        if (!isSetupAuthorized(req.body?.secret)) {
            return res.status(403).json({
                verified: false,
                error: "Registrazione non autorizzata"
            });
        }

        const pending = readChallenge(req, "registration");
        if (!pending) {
            return res.status(400).json({
                verified: false,
                error: "Challenge scaduta"
            });
        }

        const { origin, rpID } = getRp(req);
        const name = req.body?.name;
        const response = { ...req.body };
        delete response.secret;
        delete response.name;

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: pending.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: true
        });

        if (!verification.verified || !verification.registrationInfo) {
            return res.status(400).json({ verified: false });
        }

        const device = toStoredDevice(verification.registrationInfo, name);
        await upsertDevice(device);

        clearChallenge(req, res);
        setSession(req, res);

        res.json({
            verified: true,
            device: {
                id: device.id,
                name: device.name,
                createdAt: device.createdAt
            }
        });
    } catch (error) {
        console.error(error);
        clearChallenge(req, res);
        res.status(400).json({
            verified: false,
            error: error.message
        });
    }
});

router.post("/login/options", authLimiter, async (req, res) => {
    try {
        const devices = await listDevices();
        if (devices.length === 0) {
            return res.status(400).json({
                error: "Nessun dispositivo registrato"
            });
        }

        const { rpID } = getRp(req);
        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "required",
            allowCredentials: devices.map((device) => ({
                id: device.id,
                transports: device.transports
            }))
        });

        setChallenge(req, res, "authentication", options.challenge);
        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/login/verify", authLimiter, async (req, res) => {
    try {
        const pending = readChallenge(req, "authentication");
        if (!pending) {
            return res.status(400).json({
                verified: false,
                error: "Challenge scaduta"
            });
        }

        const device = await getDevice(req.body.id);
        if (!device) {
            return res.status(401).json({
                verified: false,
                error: "Dispositivo non registrato"
            });
        }

        const { origin, rpID } = getRp(req);

        const verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: pending.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: true,
            credential: {
                id: device.id,
                publicKey: isoBase64URL.toBuffer(device.publicKey),
                counter: device.counter,
                transports: device.transports
            }
        });

        if (!verification.verified) {
            return res.status(401).json({
                verified: false,
                error: "Autenticazione non valida"
            });
        }

        await upsertDevice({
            ...device,
            counter: verification.authenticationInfo.newCounter
        });

        clearChallenge(req, res);
        setSession(req, res);

        res.json({
            verified: true,
            message: "Login effettuato correttamente"
        });
    } catch (error) {
        console.error(error);
        clearChallenge(req, res);
        res.status(401).json({
            verified: false,
            error: error.message
        });
    }
});

router.get("/me", async (req, res) => {
    if (isDevAuthBypass()) {
        setSession(req, res, { sub: "dev" });
        return res.json({
            authenticated: true,
            user: { username: "dev" },
            devices: await publicDevices(),
            bypass: true
        });
    }

    const session = readSession(req);
    if (!session) {
        return res.status(401).json({ authenticated: false });
    }

    res.json({
        authenticated: true,
        user: { username: session.sub },
        devices: await publicDevices()
    });
});

router.delete("/devices/:id", requireAuth, async (req, res) => {
    try {
        const id = String(req.params.id || "").trim();
        if (!id) {
            return res.status(400).json({ error: "Id dispositivo mancante" });
        }

        await deleteDevice(id);
        res.json({
            deleted: true,
            devices: await publicDevices()
        });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

router.post("/logout", (req, res) => {
    clearSession(req, res);
    clearChallenge(req, res);
    res.json({ success: true });
});

export default router;
