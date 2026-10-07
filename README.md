# NEXORA
## Electronics & Tech Gadgets E-Commerce Platform

NEXORA is a responsive full-stack electronics storefront built for the Software Engineer Intern technical assessment. It provides a React customer experience and a NestJS REST API backed by Firebase Authentication and Firestore.

## Features

Customer features include electronics browsing, product details, catalog search and filters, a customer-owned cart, checkout, order history, PayHere Sandbox initiation, and WhatsApp order handoff when a business number is configured.

Admin features include a dashboard, catalog and inventory management, categories, brands, orders, and customer information. Admin APIs require a verified Firebase ID token and the admin role.

## Tech Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Firebase Web SDK
- Backend: NestJS 11, TypeScript, Express
- Database and authentication: Cloud Firestore, Firebase Authentication, Firebase Admin SDK
- Product images: Cloudinary integration (requires backend credentials)
- Online payments: PayHere Sandbox integration
- Messaging: WhatsApp click-to-chat checkout
- Optional search: Firestore keyword search works without Pinecone; semantic search requires Pinecone credentials and an index

## Architecture

```text
React + Vite
    | REST API, Firebase ID token
    v
NestJS API
    | Firebase Admin SDK
    v
Firebase Authentication + Cloud Firestore
    |-- Cloudinary product image uploads
    |-- PayHere Sandbox and signed server notification
    `-- WhatsApp click-to-chat handoff
```

Firebase Admin is used only by the backend for privileged authentication, Firestore operations, and payment verification. The frontend sends Firebase ID tokens to protected API routes.

## Firestore Data

The active electronics flow uses these collections:

- `products`: electronics catalog, prices, stock, descriptions, images, specifications, and status
- `categories` and `brands`: catalog taxonomy scoped with `domain: "electronics"`
- `users` and `admins`: customer and admin profiles keyed by Firebase UID
- `cart`: customer-owned cart rows
- `CustomerOrders`: customer orders, payment state, totals, and stock reservation state
- `productRatings`: product review data accessed by the product detail page

Other registered application modules also use collections for notifications, contacts, returns, loyalty, forecasts, and operational workflows. No Firestore security-rules file is included in this repository; deployed client-access rules must be reviewed in Firebase Console. Product review reads were observed to be denied by the currently configured Firestore rules during local browser testing.

## Authentication and Authorization

Firebase Authentication provides email/password and Google sign-in. Customer registration assigns the `customer` role; the registration form does not offer admin registration. Backend guards verify Firebase ID tokens and enforce role requirements. Customer records are stored in `users/{uid}` and admin records in `admins/{uid}`. A `users` profile role cannot grant admin access; an admin role must correspond to an `admins/{uid}` record.

After Firebase sign-in, the frontend sends the ID token to `POST /api/auth/session`. The backend verifies the token and creates or repairs only the caller's customer profile through Firebase Admin. Admin sessions require both an admin custom claim and a matching active admin record. The browser does not need direct read/write permission to the `users` or `admins` collections for login/profile bootstrap.

Customer cart, profile, and order APIs scope reads and writes to the authenticated UID. Product prices and stock are re-read from Firestore when an order is created; order totals are calculated by the backend and stock is reserved within a Firestore transaction. PayHere success is accepted only from a valid server notification signature, not a browser redirect.

## Local Setup

Prerequisites: Node.js 20 or newer, npm, a configured NEXORA Firebase project, and local environment files.

Backend:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
```

The API listens on `http://localhost:5000` with routes under `/api`.

Frontend (in another terminal):

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

The frontend defaults to `http://localhost:5000` for its API. Configure `VITE_API_URL` or `VITE_API_URL_RAILWAY` when using another backend host. Never set it to the temporary test port unless that is the intended local backend.

## Environment Variables

Backend Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`.

Frontend Firebase: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_MEASUREMENT_ID`.

Frontend API and checkout: `VITE_API_URL` or `VITE_API_URL_RAILWAY`, `VITE_PAYHERE_CURRENCY`, `VITE_WHATSAPP_BUSINESS_NUMBER`, `VITE_SHIPPING_FEE_LKR`.

Backend integrations: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `PAYHERE_MERCHANT_ID`, `PAYHERE_SECRET`, `PAYHERE_CURRENCY`, `WHATSAPP_BUSINESS_NUMBER`, `FRONTEND_URL`, `PORT`, `SHIPPING_FEE_LKR`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `EMAIL_USER`, and `EMAIL_PASS`.

Optional AI/search settings include `OPENAI_API_KEY`, `GROQ_API_KEY`, `GROQ_BASE_URL`, `GROQ_MODEL`, `SERPAPI_KEY`, `PINECONE_API_KEY`, and `PINECONE_INDEX`. Pinecone is optional; standard storefront search does not require it.

Keep local `.env` files and private-key files out of version control. The root `.gitignore` and nested ignore rules exclude them. Do not put Firebase Admin, Cloudinary, or PayHere secrets in frontend variables.

## Demo Catalog

The development seed is guarded to `nexora-ecommerce-2975e`, uses Firebase Admin, and is idempotent:

```powershell
cd backend
npm run seed:electronics
```

It creates eight electronics categories, eight brands, and sixteen sample electronics products. It does not import pharmacy catalog data.

## First Admin

Create the account through Firebase Authentication first. If the NEXORA `admins` collection is empty, assign the first admin locally:

```powershell
cd backend
npm run make-admin -- <firebase-uid-or-email>
```

This command is not an HTTP endpoint, refuses non-NEXORA projects, and closes first-admin setup once another admin exists. The account must sign in again to refresh its Firebase ID token. Never pass a password or token to this command.

## Payments, Images, and WhatsApp

PayHere is configured to use its Sandbox checkout URL. A backend merchant ID and secret are required to generate payment parameters; the secret remains backend-only. The backend validates the signed PayHere server notification, order amount, currency, and payment method before setting an online order to paid. Live Sandbox payment could not be exercised because `PAYHERE_MERCHANT_ID` and `PAYHERE_SECRET` are not configured.

Cloudinary image uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; without them the backend returns a service-unavailable response. Seed products include sample image URLs and the storefront has an image fallback.

WhatsApp checkout requires frontend `VITE_WHATSAPP_BUSINESS_NUMBER`. If it is blank, the checkout action is disabled. Backend `WHATSAPP_BUSINESS_NUMBER` is documented for integrations but the current checkout URL is constructed by the frontend using the Vite variable.

## Deployment Notes

The repository includes a Vercel single-page-app rewrite for the frontend, but no backend deployment manifest. Before deployment, configure the production frontend API URL, backend `FRONTEND_URL`/CORS, Firebase web and Admin settings, Cloudinary, PayHere Sandbox callback/notification URLs, and WhatsApp business number. No production URLs or external credentials are included here.

## Known Limitations

- Semantic/vector search requires Pinecone configuration; Firestore keyword search remains available.
- Cloudinary is configured, but the protected upload flow was not exercised without an authenticated admin session.
- PayHere Sandbox credentials are not configured, so payment initiation and live notification tests remain blocked.
- WhatsApp ordering is configured with the frontend business number, but checkout-to-WhatsApp was not exercised without an authenticated customer session.
- An admin record exists, but no authenticated browser session was available for live admin CRUD testing; no test customer account was available for checkout and ownership tests.
- Firestore rules are managed outside this repository and need review; product review reads were denied by the current rules in local browser testing.
- The frontend production bundle currently emits a large-chunk warning, and the local Browserslist database is stale.
