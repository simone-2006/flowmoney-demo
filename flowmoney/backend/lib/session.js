import crypto from "crypto";
import { cookieBase, sessionSecret, isDevAuthBypass } from "./config.js";

const COOKIE = "fm_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function sign(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto
        .createHmac("sha256", sessionSecret())
        .update(body)
        .digest("base64url");
    return `${body}.${sig}`;
}

function verify(token) {
    if (!token || !token.includes(".")) {
        return null;
    }

    const [body, sig] = token.split(".");
    const expected = crypto
        .createHmac("sha256", sessionSecret())
        .update(body)
        .digest("base64url");

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) {
        return null;
    }
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
    }

    try {
        const payload = JSON.parse(
            Buffer.from(body, "base64url").toString("utf8")
        );
        if (!payload.exp || payload.exp < Date.now()) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

export function readSession(req) {
    return verify(req.cookies?.[COOKIE]);
}

export function setSession(req, res, extra = {}) {
    const token = sign({
        sub: "simone",
        iat: Date.now(),
        exp: Date.now() + MAX_AGE_MS,
        ...extra
    });

    res.cookie(COOKIE, token, {
        ...cookieBase(req),
        maxAge: MAX_AGE_MS
    });
}

export function clearSession(req, res) {
    res.clearCookie(COOKIE, cookieBase(req));
}

export function requireSession(req, res, next) {
    const session = readSession(req);
    if (!session) {
        return res.status(401).json({ authenticated: false });
    }
    req.session = session;
    next();
}

/** Sessione obbligatoria, oppure bypass locale (DEV_BYPASS_AUTH). */
export function requireAuth(req, res, next) {
    if (isDevAuthBypass()) {
        req.session = readSession(req) || { sub: "dev" };
        return next();
    }
    return requireSession(req, res, next);
}
