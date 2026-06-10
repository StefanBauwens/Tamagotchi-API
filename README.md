# Tamagotchi API
Background service that runs a [TamaLib-JS](https://github.com/StefanBauwens/tamalib-js) instance, and can get and set the state with a REST API.
I created this with the intention for it to be used for the [Tamagotchi Emulator 4 Pebble (TE4P)](https://github.com/StefanBauwens/Tamagotchi-Emulator-Pebble).

When TE4P closes on the Pebble it sends it state to this service, which then runs the emulator from this point onwards, effectively running the Tamagotchi in the background while the Pebble APP is closed. When the Pebble app reopens it fetches the new state from this server and continues from there. The cycle repeats when the app closes again.

## Multiple users

A single instance can run a separate emulator for many users at once. Each request identifies its user and ROM with two headers:

- `x-pebble-id` - an opaque string identifying the user. Each id gets its own independent emulator running in the background.
- `x-rom-paste` - a raw URL to that user's Tamagotchi ROM paste (e.g. a Pastebin raw link). The ROM is downloaded on first use and cached, so the same ROM is only fetched once across all users.

### REST API

- `POST /state` - load a save and (re)start that user's background emulator. Requires both `x-pebble-id` and `x-rom-paste`. The request body is the state JSON.
- `GET /state` - return the current state of that user's emulator. Requires `x-pebble-id`. Returns `404` if the user has not `POST`ed a state yet.

If a request omits `x-rom-paste`, the optional `PASTE_URL` env var is used as a fallback ROM (see below). Emulators run until the process stops; set `IDLE_TIMEOUT_MS` to evict a user's emulator after that many milliseconds without a request.

The ROM paste contents must be a plain list of numbers (`0xFA2, 0xC87, ...`); anything else is rejected, so an untrusted paste can't inject code into the server.

### Limits and SSRF protection

Because `x-rom-paste` is a client-supplied URL the server fetches, requests targeting loopback/private/link-local hosts (e.g. cloud metadata at `169.254.169.254`) and non-`http(s)` URLs are blocked. Two env vars tune this for public deployments:

- `ROM_HOST_ALLOWLIST` - comma-separated list of allowed paste hostnames (e.g. `pastebin.com`). When set, only these hosts are fetched, which also closes DNS-rebinding; when unset, any public host is allowed.
- `MAX_SESSIONS` - cap on the number of concurrently running emulators (default `500`). New ids beyond the cap are rejected so an unbounded stream of distinct ids can't exhaust the host.

### Persistence

Pet state is saved to a `pets/` folder in the working directory. Each pet is autosaved every 5 minutes (and immediately on `POST /state`, on eviction, and on shutdown), then restored automatically when the server starts again - so background pets survive restarts. To run a fresh instance with no saved pets, delete the `pets/` folder.

When running in Docker, mount a volume at `/app/pets` to keep saves across container recreation, e.g. `-v tamagotchi-pets:/app/pets`.

## Version Info

Version 1.1.

- Updated to latest version of TamaLIB. This version is only compatible with Tamagotchi Emulator 4 Pebble 1.3.0 or higher.


Version 1.0.

- Compatible with Tamagotchi Emulator 4 Pebble 1.2.0 or lower. Please Upgrade.


## Run with Docker
### Pull docker image
The official docker image is available at `ghcr.io/stefanbauwens/tamagotchi-api:latest` if you don't want to build manually. 
```
docker pull ghcr.io/stefanbauwens/tamagotchi-api:latest
```

### Build manually
Download this repository.
CD to the main directory.

```
docker build -t tamagotchi-api .
```
### Run
If using the official docker image replace `tamagotchi-api` with `ghcr.io/stefanbauwens/tamagotchi-api:latest` in the docker run command. 

ROMs are normally supplied per-user via the `x-rom-paste` header (see [Multiple users](#multiple-users)), so no ROM is needed to start the server:

```
docker run -e PORT=5000 -p 5000:5000 tamagotchi-api
```

Optionally set `PASTE_URL` to a raw url for a Tamagotchi ROM (P1 or P2) in usigned_12 format (0xFA2, 0xC87, ...) to act as a fallback for requests that omit the `x-rom-paste` header. Someone seems to have done the work for us: [P1 link](https://pastebin.com/raw/iN0pfyr7) or [P2 link](https://pastebin.com/raw/TXkwnBZA)

```
docker run -e PORT=5000 -e PASTE_URL=[URL HERE] -p 5000:5000 tamagotchi-api
```

Or to run in the background and automatic restart if server restarts: 
```
docker run -d --restart unless-stopped -e PORT=5000 -p 5000:5000 tamagotchi-api
```
Pet state is persisted to the `pets/` folder and restored on restart (see [Persistence](#persistence)). Mount a volume at `/app/pets` to keep saves across container recreation:
```
docker run -d --restart unless-stopped -e PORT=5000 -v tamagotchi-pets:/app/pets -p 5000:5000 tamagotchi-api
```


This will run the server on `http://localhost:5000`

If using this for the Pebble Tamagotchi Emulator, with a phone running on the same network as this server, you can just fill in `http://local_ip:5000` using the local IP of the server PC. 

If you want to run this from anywhere you need to handle port forwarding on your server PC and/or use a domain name with a proxy service such as Caddy. Once that is set up you can fill in `https://domain_name:PORT` in the server address in the Pebble Tamagotchi Emulator settings.
