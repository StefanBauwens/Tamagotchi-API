/*
 * Manages one emulator per user. Users are identified by the `x-pebble-id`
 * header; each user's ROM comes from the URL in the `x-rom-paste` header.
 */

const fs = require('fs');
const fsp = require('fs').promises;
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const Emulator = require('./emulator');

// The driver paces each emulator against its own virtual clock (emu.refTs(),
// in microseconds). Each wake-up runs steps until the emulator is LOOKAHEAD_US
// of virtual time ahead of real time, then sleeps for that gap so the event loop
// is yielded between bursts. STEP_BUDGET caps work per wake-up so a pet that has
// fallen far behind (or runs on the fast OSC3 clock) can't wedge the event loop;
// it simply catches up over several wake-ups, or degrades by lagging if it can't.
const LOOKAHEAD_US = 15000;
const STEP_BUDGET = 100000;

// Hard cap on concurrently running emulators so an unbounded stream of distinct
// pebble ids can't exhaust CPU/memory/disk. Tune with MAX_SESSIONS.
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS, 10) || 500;

// Optional comma-separated allowlist of hostnames permitted for x-rom-paste.
// When set, it's the strongest SSRF defence (also closes DNS-rebinding). When
// empty, any public host is allowed but private/loopback targets are blocked.
const ROM_HOST_ALLOWLIST = (process.env.ROM_HOST_ALLOWLIST || '')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);

// Pet state is persisted to disk so background pets survive a restart.
const PETS_DIR = path.resolve(process.cwd(), 'pets');
const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;

fs.mkdirSync(PETS_DIR, { recursive: true });

// Evict an emulator after this long without any request. Disabled by default
// so background pets keep running indefinitely (set IDLE_TIMEOUT_MS to enable).
const IDLE_TIMEOUT_MS = parseInt(process.env.IDLE_TIMEOUT_MS, 10) || 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

const romCache = new Map();   // pasteUrl -> Promise<romSource>
const sessions = new Map();   // pebbleId -> { emu, loopInterval, pasteUrl, lastAccess }
const pending = new Map();    // pebbleId -> Promise<session> (in-flight creation)

// Is `host` a literal IP in a private/loopback/link-local range? Used to block
// the obvious SSRF targets (cloud metadata, internal services) for paste URLs.
function isBlockedHost(host) {
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
        return true;
    }
    if (net.isIPv4(host)) {
        const [a, b] = host.split('.').map(Number);
        if (a === 0 || a === 10 || a === 127) return true;       // this-host, private, loopback
        if (a === 169 && b === 254) return true;                  // link-local (incl. cloud metadata)
        if (a === 172 && b >= 16 && b <= 31) return true;         // private
        if (a === 192 && b === 168) return true;                  // private
        return false;
    }
    if (net.isIPv6(host)) {
        const h = host.toLowerCase();
        if (h === '::1' || h === '::') return true;               // loopback / unspecified
        if (h.startsWith('fe80')) return true;                    // link-local
        if (h.startsWith('fc') || h.startsWith('fd')) return true; // unique-local
        return false;
    }
    return false;
}

// Validate a user-supplied paste URL before the server fetches it (SSRF guard).
function assertSafePasteUrl(pasteUrl) {
    let url;
    try {
        url = new URL(pasteUrl);
    } catch {
        throw new Error('x-rom-paste is not a valid URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('x-rom-paste must be an http(s) URL');
    }
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (ROM_HOST_ALLOWLIST.length) {
        if (!ROM_HOST_ALLOWLIST.includes(host)) {
            throw new Error(`x-rom-paste host ${host} is not in ROM_HOST_ALLOWLIST`);
        }
    } else if (isBlockedHost(host)) {
        throw new Error(`x-rom-paste host ${host} is not allowed`);
    }
}

// Turn a raw ROM paste (comma/whitespace-separated numbers, e.g. "0xFA2, 0xC87")
// into loadable JS source. The values are parsed and re-emitted as numbers, so
// arbitrary text in the paste can never be executed (no code injection).
function buildRomSource(text) {
    const tokens = text.split(/[\s,]+/).filter(Boolean);
    if (tokens.length === 0) {
        throw new Error('ROM is empty');
    }
    const values = tokens.map(tok => {
        if (!/^(0x[0-9a-fA-F]+|\d+)$/.test(tok)) {
            throw new Error(`ROM contains a non-numeric value: ${tok}`);
        }
        return Number(tok);
    });
    return `var my_program = [${values.join(',')}];`;
}

// Fetch a ROM paste and parse it into loadable JS source. Cached by URL so the
// same ROM is only downloaded once even across users.
function fetchRom(pasteUrl) {
    if (!romCache.has(pasteUrl)) {
        const promise = (async () => {
            assertSafePasteUrl(pasteUrl);
            const res = await fetch(pasteUrl);
            if (!res.ok) {
                throw new Error(`Failed to fetch ROM from ${pasteUrl} (HTTP ${res.status})`);
            }
            const text = await res.text();
            return buildRomSource(text);
        })();
        // Don't cache failures, so a later request can retry.
        promise.catch(() => romCache.delete(pasteUrl));
        romCache.set(pasteUrl, promise);
    }
    return romCache.get(pasteUrl);
}

function startLoop(session) {
    if (session.loopInterval !== null) return;
    const emu = session.emu;

    // Re-anchor the virtual clock to now, so a freshly created or restored pet
    // doesn't try to replay all the virtual time since it was last saved.
    emu.syncClock();

    const tick = () => {
        try {
            let steps = 0;
            // Advance until the emulator is a small lookahead ahead of real time.
            while (emu.refTs() - Date.now() * 1000 < LOOKAHEAD_US && steps < STEP_BUDGET) {
                emu.step();
                steps++;
            }
            // Sleep until real time catches up to the virtual clock (yielding the
            // event loop). If we exhausted the step budget we're behind, so the
            // gap is <= 0 and we run again immediately.
            const delayMs = Math.max(0, (emu.refTs() - Date.now() * 1000) / 1000);
            session.loopInterval = setTimeout(tick, delayMs);
        } catch (err) {
            // A bad save (or otherwise broken state) must not crash the whole
            // process or spin forever throwing - stop just this pet's loop.
            console.error(`Emulator ${session.pebbleId} loop stopped:`, err.message);
            stopLoop(session);
        }
    };

    session.loopInterval = setTimeout(tick, 0);
}

function stopLoop(session) {
    if (session.loopInterval !== null) {
        clearTimeout(session.loopInterval);
        session.loopInterval = null;
    }
}

function destroySession(pebbleId) {
    const session = sessions.get(pebbleId);
    if (session) {
        saveSession(session); // persist progress before dropping it from memory
        stopLoop(session);
        sessions.delete(pebbleId);
    }
}

// On-disk file for a pet. The pebble id is opaque, so hash it for a safe,
// stable filename; the real id is stored inside the file for restoring.
function petFile(pebbleId) {
    const hash = crypto.createHash('sha256').update(pebbleId).digest('hex');
    return path.join(PETS_DIR, `${hash}.json`);
}

// Serialize a pet's current state for persistence.
function snapshot(session) {
    return JSON.stringify({
        pebbleId: session.pebbleId,
        pasteUrl: session.pasteUrl,
        state: JSON.parse(session.emu.getState()),
        savedAt: new Date().toISOString(),
    });
}

// Persist a single pet's state to disk synchronously (atomically via a temp
// file). Used where we can't yield: POST /state and shutdown.
function saveSession(session) {
    const file = petFile(session.pebbleId);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, snapshot(session));
    fs.renameSync(tmp, file);
}

// Async variant used by the periodic autosave so the sweep doesn't block the
// event loop (and stall every emulator's loop) while writing many pets.
async function saveSessionAsync(session) {
    const file = petFile(session.pebbleId);
    const tmp = `${file}.tmp`;
    await fsp.writeFile(tmp, snapshot(session));
    await fsp.rename(tmp, file);
}

// Persist every running pet synchronously. Per-pet failures are logged but never
// abort the rest. Used on shutdown, where the process is about to exit.
function saveAll() {
    for (const session of sessions.values()) {
        try {
            saveSession(session);
        } catch (err) {
            console.error(`Failed to save pet ${session.pebbleId}:`, err.message);
        }
    }
}

// Async autosave of every running pet; never blocks the event loop.
async function saveAllAsync() {
    await Promise.allSettled(
        [...sessions.values()].map((session) =>
            saveSessionAsync(session).catch((err) => {
                console.error(`Failed to save pet ${session.pebbleId}:`, err.message);
            })
        )
    );
}

// Recreate one pet's emulator from a persisted snapshot and (re)start its loop.
// Shared by boot-time restoreAll and on-demand rehydration from shared storage.
async function restoreSession(data) {
    const session = await getOrCreateSession(data.pebbleId, data.pasteUrl);
    stopLoop(session);
    session.emu.setState(JSON.stringify(data.state));
    startLoop(session);
    return session;
}

// Look up an existing emulator for a user (without creating one).
function getSession(pebbleId) {
    const session = sessions.get(pebbleId);
    if (session) session.lastAccess = Date.now();
    return session;
}

// Like getSession, but if the pet isn't in this node's memory, try to rehydrate
// it from shared storage. This is what lets sharded routing move a pet to a new
// node (or recover an idle-evicted pet) without the client re-POSTing its save.
// Returns null only if no save exists anywhere.
async function getOrRestoreSession(pebbleId) {
    const existing = getSession(pebbleId);
    if (existing) return existing;

    let data;
    try {
        data = JSON.parse(await fsp.readFile(petFile(pebbleId), 'utf-8'));
    } catch {
        return null; // no persisted save -> genuinely unknown pet
    }

    // A concurrent request may have restored it while we were reading the file;
    // reuse that. Otherwise restore. restoreSession coalesces on the same id and
    // just reloads the same snapshot, so a rare double-restore is harmless.
    return getSession(pebbleId) || restoreSession(data);
}

// Get the user's emulator, creating it (and fetching its ROM) if needed. If the
// user switches to a different ROM, the old emulator is torn down and replaced.
async function getOrCreateSession(pebbleId, pasteUrl) {
    const existing = sessions.get(pebbleId);
    if (existing && existing.pasteUrl === pasteUrl) {
        existing.lastAccess = Date.now();
        return existing;
    }

    // Coalesce concurrent creation for the same user.
    if (pending.has(pebbleId)) {
        await pending.get(pebbleId);
        return getOrCreateSession(pebbleId, pasteUrl);
    }

    // Reject brand-new pets once we're at capacity (replacing an existing pet's
    // ROM is net-neutral, so only a genuinely new id is blocked).
    if (!existing && sessions.size >= MAX_SESSIONS) {
        throw new Error(`Session limit reached (${MAX_SESSIONS})`);
    }

    const creation = (async () => {
        if (existing) destroySession(pebbleId); // ROM changed -> rebuild
        const romSource = await fetchRom(pasteUrl);
        const emu = new Emulator(romSource);
        const session = { pebbleId, emu, loopInterval: null, pasteUrl, lastAccess: Date.now() };
        sessions.set(pebbleId, session);
        return session;
    })();

    pending.set(pebbleId, creation);
    try {
        return await creation;
    } finally {
        pending.delete(pebbleId);
    }
}

if (IDLE_TIMEOUT_MS > 0) {
    setInterval(() => {
        const now = Date.now();
        for (const [id, session] of sessions) {
            if (now - session.lastAccess > IDLE_TIMEOUT_MS) {
                destroySession(id);
            }
        }
    }, SWEEP_INTERVAL_MS).unref();
}

setInterval(saveAllAsync, AUTOSAVE_INTERVAL_MS).unref();

module.exports = {
    getSession,
    getOrRestoreSession,
    getOrCreateSession,
    startLoop,
    stopLoop,
    destroySession,
    saveSession,
    saveAll,
};
