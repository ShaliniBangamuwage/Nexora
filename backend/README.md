# NEXORA Backend API

This NestJS backend powers the NEXORA electronics storefront, including storefront catalog APIs, customer order flows, admin management, auth checks, and operational integrations such as Cloudinary, WhatsApp checkout, and PayHere sandbox payments.

## Overview

The backend exposes a REST API under the `/api` prefix and integrates with Firebase Admin SDK for authentication and Firestore access. It supports:

- Customer shopping flow and product catalog
- Cart and order creation
- Admin management and approvals
- File/media upload handling
- Email and notification workflows
- Payment hash generation for PayHere sandbox

## Tech stack

- NestJS + TypeScript
- Firebase Admin SDK
- Firestore + Firebase Auth
- Express CORS configuration
- Cloudinary-ready uploads
- Nodemailer for admin/customer notifications

## Project structure

```text
src/
├── admin/         # Admin dashboards, approvals, search, and notifications
├── auth/          # Firebase auth guard and role validation
├── customer/      # Storefront APIs for products, cart, orders, profile, etc.
├── shared/        # Firebase, mail, counters, search, and common services
├── app.module.ts  # Application module registration
├── app.controller.ts
├── app.service.ts
└── main.ts        # Bootstrapping and global CORS setup
```

## Prerequisites

- Node.js 18+
- npm
- Firebase project with service account credentials
- Environment variables for email, storage, and payment integrations

## Environment setup

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Example values are included in `.env.example`.

## Available scripts

```bash
npm install
npm run start
npm run start:dev
npm run start:debug
npm run build
npm run test
npm run test:e2e
npm run lint
```

## Local development

Start the API with:

```bash
npm run start:dev
```

The server runs at:

- `http://localhost:5000`
- API prefix: `http://localhost:5000/api`

## Notes

- Uploaded files are served from `/uploads`
- Storefront product APIs expect the `products` collection as the source of truth
- Secrets and gateway credentials should always live in `.env`, never in source code
