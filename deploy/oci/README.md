OCI (Oracle Cloud) deployment quick start

1) Create an Always Free VM
- Shape: Ampere A1 (Always Free) or small AMD
- Image: Ubuntu 22.04 LTS
- Networking: public subnet, assign public IP
- Security list: allow inbound 80, 443, 3000 (temporary), 5432 (optional/private)

2) Install Docker & Compose on the VM
```
sudo apt update -y && sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update -y && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

3) Pull code and configure env
```
git clone <your-repo-url> && cd asktennis
cp deploy/oci/.env.example .env
# Edit .env with your real keys and DB URL if using external DB
```

4) Launch with Docker Compose (app + Postgres on the VM)
```
docker compose -f docker-compose.oci.yml up -d --build
```

5) Optional: Reverse proxy + SSL (Caddy)
```
docker run -d --name caddy --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v caddy_data:/data -v caddy_config:/config \
  -v $(pwd)/deploy/oci/Caddyfile:/etc/caddy/Caddyfile \
  caddy:2
```

6) Migrations/seed (if needed)
```
docker exec -it askt_app node seed.js
```

Notes
- The app expects PostgreSQL. Using Oracle Autonomous Database is not drop-in compatible; prefer Postgres on VM or a managed Postgres.
- For persistence, `db_data` volume stores Postgres data. Snapshot the VM or back up the volume regularly.


