# Tamagotchi API
Background service that runs a [TamaLib-JS](https://github.com/StefanBauwens/tamalib-js) instance, and can get and set the state with a REST API.
I created this with the intention for it to be used for the Pebble Tamagotchi Emulator (PTE).

When the PTE closes on the Pebble it sends it state to this service, which then runs the emulator from this point onwards, effectively running the Tamagotchi in the background while the Pebble APP is closed. When the Pebble app reopens it fetches the new state from this server and continues from there. The cycle repeats when the app closes again.

## Run with Docker
Download this repository.

CD to the main directory.

```
docker build -t tamagotchi-api .
```

Then replace the `[URL HERE]` with a raw url to a Tamagotchi P1 ROM in usigned_12 format (0xFA2, 0xC87, ...). Someone seems to have done the work for us: [link](https://pastebin.com/raw/iN0pfyr7)

```
docker run -e PORT=5000 -e PASTE_URL=[URL HERE] -p 5000:5000 tamagotchi-api
```

Or to run in the background and automatic restart if server restarts: 
```
docker run -d --restart unless-stopped -e PORT=5000 -e PASTE_URL=[URL HERE] -p 5000:5000 tamagotchi-api
```
Note: No states are saved upon restarts! (However if your PTE is running in the foreground while your server restarts it shouldn't be an issue).


This will run the server on `http://localhost:5000`

If using this for the Pebble Tamagotchi Emulator, with a phone running on the same network as this server, you can just fill in `http://local_ip:5000` using the local IP of the server PC. 

If you want to run this from anywhere you need to handle port forwarding on your server PC and/or use a domain name with a proxy service such as Caddy. Once that is set up you can fill in `https://domain_name:PORT` in the server address in the Pebble Tamagotchi Emulator settings.