# Deploying Harry Overseas to Vercel

Harry Overseas (Harry Overseas Immigration) is configured for seamless deployment on **Vercel** as a full-stack application:

- **Frontend**: Vite + React SPA served from `dist` with client-side routing.
- **Backend**: Express REST API running as a Vercel Serverless Function via [`api/index.js`](file:///e:/Projects/VS_Projects/Harry Overseas/api/index.js).

---

## 1. Project Configuration Files

- **[`vercel.json`](file:///e:/Projects/VS_Projects/Harry Overseas/vercel.json)**:
  Configured with:
  - `buildCommand`: `npm run build`
  - `outputDirectory`: `dist`
  - `framework`: `vite`
  - Rewrites all `/api/*` traffic to the serverless function [`api/index.js`](file:///e:/Projects/VS_Projects/Harry Overseas/api/index.js)
  - Rewrites all other routes to `/index.html` for client-side SPA routing.

- **[`api/index.js`](file:///e:/Projects/VS_Projects/Harry Overseas/api/index.js)**:
  Wraps the Express backend and ensures database connection initialization before request handling.

---

## 2. Environment Variables Configuration

In your Vercel Dashboard under **Project Settings → Environment Variables**, configure the following variables:

| Variable                   | Description                                     | Example / Recommendation                                                        |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `JWT_SECRET`               | Secret key for signing and verifying admin JWTs | `harry_global_secret_key_2026_production`                                       |
| `ADMIN_USERNAME`           | Admin portal username                           | `admin`                                                                         |
| `ADMIN_PASSWORD`           | Strong password for admin login                 | _(your strong password)_                                                        |
| `ADMIN_EMAIL`              | Admin contact & notification email              | `admin@harryglobal.com`                                                         |
| `DATABASE_URL`             | **(Recommended)** PostgreSQL connection URL     | `postgresql://user:pass@ep-cool.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `EMAIL_HOST`               | SMTP server host _(optional)_                   | `smtp.gmail.com`                                                                |
| `EMAIL_PORT`               | SMTP port _(optional)_                          | `587`                                                                           |
| `EMAIL_USER`               | SMTP username _(optional)_                      | `notifications@harryglobal.com`                                                 |
| `EMAIL_PASS`               | SMTP application password _(optional)_          | _(app password)_                                                                |
| `WHATSAPP_API_TOKEN`       | Meta WhatsApp Cloud API token _(optional)_      | _(token)_                                                                       |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Phone Number ID _(optional)_           | _(id)_                                                                          |

> [!NOTE]
> **Database Persistence in Serverless**:
>
> - For persistent storage in production, provide a PostgreSQL connection URL (`DATABASE_URL`) from [Neon](https://neon.tech), [Supabase](https://supabase.com), or Vercel Postgres.
> - If `DATABASE_URL` is omitted, the app will run with SQLite writing to `/tmp/database.sqlite`, which is suitable for temporary previews and testing (though ephemeral across container lifecycles).

---

## 3. Deployment Options

### Option A: Deploy via GitHub (Recommended)

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New... → Project**.
3. Select your repository.
4. Set the **Environment Variables** listed above.
5. Click **Deploy**. Vercel will build the frontend with `npm run build` and deploy the serverless functions automatically.

### Option B: Deploy via Vercel CLI

From the project root:

```bash
# 1. Login to Vercel (if not already logged in)
npx vercel login

# 2. Deploy preview
npx vercel

# 3. Deploy to production
npx vercel --prod
```
