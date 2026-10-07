# NEXORA Storefront

React 19 + Vite storefront for NEXORA, an electronics and tech-gadget store. The app uses Firebase Authentication, the NestJS API, and Firestore-backed catalog/order data.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill the Firebase web-app settings, API URL, and optional store contact settings.
3. Start the backend from `../backend` with `npm run start:dev`.
4. Start Vite with `npm run dev`.
5. Open the URL Vite prints (normally `http://localhost:3000`).

## Environment

`VITE_API_URL` is the backend origin only, without `/api`. For example, `http://localhost:5000`. Use `VITE_API_URL_RAILWAY` instead when deploying to the configured hosted API.

Firebase web configuration is required for sign-in and protected customer/admin pages. These values are Firebase web-app identifiers, not Admin SDK secrets. Never put Firebase service-account credentials, PayHere secrets, or Cloudinary secrets in the frontend environment.

`VITE_WHATSAPP_BUSINESS_NUMBER` is the store WhatsApp number in international digits without `+`. It is intentionally blank in the example. When unset, WhatsApp contact links are hidden and checkout reports that WhatsApp ordering is not configured.

`VITE_SHIPPING_FEE_LKR` and `VITE_PAYHERE_CURRENCY` must agree with `SHIPPING_FEE_LKR` and `PAYHERE_CURRENCY` in the backend. Shipping defaults to LKR 400. `VITE_STORE_PHONE`, `VITE_STORE_EMAIL`, and `VITE_STORE_ADDRESS` are optional and are only shown when configured.

## Store flows

- Customer: `/customer`, `/customer/products`, `/customer/cart`, `/customer/checkout`, `/customer/orders`
- Admin: `/admin`, `/admin/products`, `/admin/orders`
- Product images are uploaded through the authenticated admin API to Cloudinary; Cloudinary credentials belong only in the backend `.env`.
- PayHere uses the Sandbox checkout URL. The backend derives the amount and hash from the authenticated customer’s persisted pending order; only the signed PayHere notification can confirm an online payment.

## Checks

```bash
npm run build
```

The configured `npm test` command currently invokes Create React App Jest in a Vite/ESM project; it may fail to parse `import.meta.env` in test modules. Use the production Vite build for compilation until the test runner configuration is migrated.
