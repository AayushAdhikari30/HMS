# Running the HMS with Docker (LAN server)

One PC runs everything; other PCs on the same network use it from a browser.

## On the SERVER PC (one-time)

1. **Install Docker Desktop** (Windows/Mac) or Docker Engine (Linux) and start it.
2. From the project root (where `docker-compose.yml` is):
   ```bash
   copy .env.docker.example .env      # Windows  (use: cp on Mac/Linux)
   ```
   Edit `.env` — set `DB_PASSWORD` and the two `JWT_*` secrets to long random strings.
3. Build and start everything:
   ```bash
   docker compose up -d --build
   ```
   First build takes a few minutes. It creates 3 containers: `db`, `backend`, `frontend`.
4. Load the medicine catalogue (once):
   ```bash
   docker compose exec backend npm run seed:medicines
   ```
5. (Optional) create the first admin account:
   ```bash
   docker compose exec backend node src/seed/createFirstAdmin.js
   ```

The app is now live on the server at **http://localhost/**

## Connect from OTHER PCs

1. Find the server PC's LAN IP:
   - Windows: `ipconfig` → look for **IPv4 Address** (e.g. `192.168.1.50`)
   - Mac/Linux: `ip addr` or `ifconfig`
2. On any other PC on the same Wi-Fi/network, open a browser to:
   ```
   http://192.168.1.50/
   ```
   (replace with the real IP). No installation needed on client PCs.

### If other PCs can't reach it
- **Windows Firewall** on the server is the usual blocker. Allow inbound TCP port **80**:
  - Windows Security → Firewall → Advanced → Inbound Rules → New Rule → Port → TCP 80 → Allow.
- Make sure both PCs are on the **same network** (not one on Wi-Fi guest, one on Ethernet VLAN).
- Confirm the server is up: on the server, `http://localhost/` should work first.

## Everyday commands

```bash
docker compose logs -f backend     # watch backend logs
docker compose ps                  # container status
docker compose down                # stop (database is KEPT in the db_data volume)
docker compose up -d               # start again
docker compose down -v             # stop AND delete the database (fresh start)
docker compose up -d --build       # rebuild after code changes
```

## Notes
- Data persists in the `db_data` Docker volume across restarts. `down -v` wipes it.
- `NODE_ENV` is set to `development` in compose so login cookies work over plain
  HTTP on a LAN. For a real internet deployment you'd put this behind HTTPS.
- Email is optional: leave `MAIL_*` blank and reset/verification links print to
  `docker compose logs backend` instead of being emailed.
