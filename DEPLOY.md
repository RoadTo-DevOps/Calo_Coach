# Huong Dan Deploy VPS

Tai lieu nay huong dan deploy app CaloCoach len VPS Ubuntu bang Node.js, PM2, MongoDB va Nginx.

## 1. Chuan Bi

Can co:

- VPS Ubuntu 22.04 hoac 24.04
- Domain tro ve IP VPS, vi du `calocoach.com`
- Node.js 20+
- MongoDB local hoac MongoDB Atlas
- Repo co 2 thu muc `client/` va `server/`

Luu y bao mat: khong dua API key vao file `.env.example` hoac git. Neu key Beek/OpenAI tung bi day len repo, hay rotate key moi truoc khi deploy production.

## 2. Cai Package Tren VPS

```bash
sudo apt update
sudo apt install -y nginx git curl ufw
```

Cai Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Cai PM2:

```bash
sudo npm install -g pm2
```

## 3. Lay Code Len VPS

Vi du dat app tai `/var/www/health_care`:

```bash
sudo mkdir -p /var/www/health_care
sudo chown -R $USER:$USER /var/www/health_care
cd /var/www/health_care
git clone <repo-url> .
```

Neu upload code thu cong, dam bao root chi co:

```text
README.md
client/
server/
```

## 4. Cau Hinh Backend

```bash
cd /var/www/health_care/server
npm install
cp .env.example .env
nano .env
```

File `server/.env` mau:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/health_care
JWT_SECRET=doi-thanh-chuoi-random-that-dai
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*

AI_PROVIDER=beek
AI_TIMEOUT_MS=15000

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

BEE_API_KEY=your_beek_key_here
BEE_BASE_URL=https://platform.beeknoee.com/api/v1
BEE_MODEL=gemini-2.5-flash-lite
```

Ghi chu:

- `CORS_ORIGIN=*` dung duoc vi app dang dung JWT qua `Authorization` header, khong dung cookie credential.
- Neu dung OpenAI thi set `AI_PROVIDER=openai` va dien `OPENAI_API_KEY`.
- Neu dung Beek thi set `AI_PROVIDER=beek` va dien `BEE_API_KEY`.

Chay backend bang PM2:

```bash
cd /var/www/health_care/server
pm2 start src/server.js --name health-care-api
pm2 save
pm2 startup
```

Kiem tra:

```bash
pm2 status
curl http://127.0.0.1:5000/api/health
```

## 5. Cau Hinh Frontend

```bash
cd /var/www/health_care/client
npm install
cp .env.example .env
nano .env
```

Neu backend di qua cung domain voi Nginx, nen dung:

```env
VITE_API_BASE_URL=https://calocoach.com/api
```

Neu chua co domain va test bang IP:

```env
VITE_API_BASE_URL=http://<VPS_IP>:5000/api
```

Build frontend:

```bash
cd /var/www/health_care/client
npm run build
```

Thu muc build se la:

```text
/var/www/health_care/client/dist
```

## 6. Cau Hinh Nginx

Tao file:

```bash
sudo nano /etc/nginx/sites-available/health_care
```

Noi dung, thay `calocoach.com` bang domain cua ban:

```nginx
server {
    listen 80;
    server_name calocoach.com www.calocoach.com;

    root /var/www/health_care/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/health_care /etc/nginx/sites-enabled/health_care
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL HTTPS

Cai Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d calocoach.com -d www.calocoach.com
```

Kiem tra auto-renew:

```bash
sudo certbot renew --dry-run
```

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Neu dung Nginx proxy nhu tren thi khong can mo port `5000` ra internet.

## 9. Cap Nhat Code Sau Nay

```bash
cd /var/www/health_care
git pull

cd server
npm install
pm2 restart health-care-api

cd ../client
npm install
npm run build

sudo systemctl reload nginx
```

## 10. Check Loi Nhanh

Backend:

```bash
pm2 logs health-care-api
curl http://127.0.0.1:5000/api/health
```

Frontend:

```bash
curl -I https://calocoach.com
```

MongoDB:

```bash
mongosh
show dbs
```

CORS:

- Neu dung domain: frontend `VITE_API_BASE_URL=https://calocoach.com/api`
- Backend `.env`: `CORS_ORIGIN=*`
- Sau khi sua `.env`, nho restart backend:

```bash
pm2 restart health-care-api
```

## 11. Len Production Can Nho

- Doi `JWT_SECRET` thanh chuoi dai, ngau nhien.
- Khong commit file `.env`.
- Rotate API key neu key da tung lo.
- Nen backup MongoDB dinh ky.
- Khong mo port MongoDB ra internet.
- Nen dung HTTPS truoc khi cho nguoi dung that su dung.
