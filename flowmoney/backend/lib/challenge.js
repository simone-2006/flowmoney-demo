import crypto from "crypto";
import { cookieBase, sessionSecret } from "./config.js";

const COOKIE = "fm_challenge";
const MAX_AGE_MS = 1000 * 60 * 5;

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

export function setChallenge(req, res, type, challenge, extra = {}) {
    const token = sign({
        type,
        challenge,
        exp: Date.now() + MAX_AGE_MS,
        ...extra
    });

    res.cookie(COOKIE, token, {
        ...cookieBase(req),
        maxAge: MAX_AGE_MS
    });
}

export function readChallenge(req, type) {
    const payload = verify(req.cookies?.[COOKIE]);
    if (!payload || payload.type !== type || !payload.challenge) {
        return null;
    }
    return payload;
}

export function clearChallenge(req, res) {
    res.clearCookie(COOKIE, cookieBase(req));
}
