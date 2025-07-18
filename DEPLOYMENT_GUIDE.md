# Production Deployment Guide

## Building for Production

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Build the application:**
```bash
npm run build
```

This creates:
- `backend/dist/` - Compiled backend code
- `frontend/dist/` - Optimized frontend bundle

## Deployment Options

### Option 1: Node.js Server (Recommended)

1. **Create a production start script** (`start-production.js`):

```javascript
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

// Start backend
const backendProcess = spawn('node', ['backend/dist/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '8890', NODE_ENV: 'production' }
});

// Serve frontend
const app = express();
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Proxy API requests
app.use('/api', (req, res) => {
  const apiUrl = `http://localhost:8890${req.url}`;
  req.pipe(require('http').request(apiUrl, {
    method: req.method,
    headers: req.headers
  }, (apiRes) => {
    res.status(apiRes.statusCode);
    Object.keys(apiRes.headers).forEach(key => {
      res.setHeader(key, apiRes.headers[key]);
    });
    apiRes.pipe(res);
  }));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
```

2. **Run in production:**
```bash
NODE_ENV=production node start-production.js
```

### Option 2: Docker Deployment

1. **Create a Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/shared ./shared

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --only=production

WORKDIR /app

# Copy start script
COPY start-production.js .

EXPOSE 3000

CMD ["node", "start-production.js"]
```

2. **Build and run Docker container:**
```bash
docker build -t map-generator .
docker run -p 3000:3000 map-generator
```

### Option 3: Cloud Deployment

#### Heroku

1. **Create a `Procfile`:**
```
web: node start-production.js
```

2. **Deploy:**
```bash
heroku create your-app-name
git push heroku main
```

#### Vercel/Netlify (Frontend only)

1. **Deploy frontend:**
```bash
cd frontend
vercel --prod
```

2. **Deploy backend separately** (e.g., on Railway, Render, or Fly.io)

#### AWS/GCP/Azure

Use their respective Node.js deployment guides with the Docker container.

## Environment Variables

Create a `.env` file for production:

```env
NODE_ENV=production
PORT=3000
BACKEND_PORT=8890
```

## Performance Optimization

1. **Enable compression:**
```bash
npm install compression
```

Add to your production server:
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Use PM2 for process management:**
```bash
npm install -g pm2
pm2 start start-production.js --name map-generator
pm2 save
pm2 startup
```

3. **Set up nginx reverse proxy:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

1. **Add rate limiting:**
```bash
npm install express-rate-limit
```

2. **Add helmet for security headers:**
```bash
npm install helmet
```

3. **Validate file uploads:**
- Limit file size (already implemented)
- Validate file types (already implemented)
- Consider virus scanning for production

4. **Use HTTPS in production**

## Monitoring

1. **Add logging:**
```bash
npm install winston
```

2. **Set up monitoring** (e.g., New Relic, DataDog)

3. **Health check endpoint:**
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

## Backup & Recovery

1. **Regular backups** of uploaded tilesets (if storing)
2. **Database backups** (if implementing persistence)
3. **Version control** for configuration

## Scaling

For high traffic:
1. Use Redis for session storage
2. Implement horizontal scaling with load balancer
3. Use CDN for static assets
4. Consider microservices architecture

## Final Checklist

- [ ] Build application
- [ ] Set environment variables
- [ ] Configure domain/SSL
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test all features
- [ ] Set up CI/CD pipeline
- [ ] Document deployment process