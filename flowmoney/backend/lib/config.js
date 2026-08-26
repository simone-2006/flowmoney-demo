import crypto from "crypto";

export const rpName = process.env.WEBAUTHN_RP_NAME || "Flowmoney";

export function getRp(req) {
    if (process.env.WEBAUTHN_RP_ID && process.env.WEBAUTHN_ORIGIN) {
        return {
            rpName,
            rpID: process.env.WEBAUTHN_RP_ID,
            origin: process.env.WEBAUTHN_ORIGIN
        };
    }

    const host = String(req.headers.host || "localhost").split(":")[0];
    const isLocal = host === "localhost" || host === "127.0.0.1";

    if (isLocal) {
        return {
            rpName,
            rpID: "localhost",
            origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
        };
    }

    return {
        rpName,
        rpID: host,
        origin: `https://${req.headers.host}`
    };
}

export function cookieBase(req) {
    const proto = req.headers["x-forwarded-proto"];
    const secure =
        process.env.NODE_ENV === "production" || proto === "https";

    return {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/"
    };
}

export function secretsEqual(a, b) {
    const left = crypto.createHash("sha256").update(String(a || "")).digest();
    const right = crypto.createHash("sha256").update(String(b || "")).digest();
    return crypto.timingSafeEqual(left, right);
}

export function isSetupAuthorized(secret) {
    const expected = process.env.SETUP_SECRET;
    if (!expected) {
        return false;
    }
    return secretsEqual(secret, expected);
}

export function sessionSecret() {
    const secret = process.env.SESSION_SECRET || process.env.SETUP_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET mancante");
    }
    return secret;
}

/** Solo locale: salta WebAuthn se DEV_BYPASS_AUTH=true */
export function isDevAuthBypass() {
    if (process.env.NODE_ENV === "production") {
        return false;
    }
    const flag = String(process.env.DEV_BYPASS_AUTH || "").toLowerCase();
    return flag === "1" || flag === "true" || flag === "yes";
}
