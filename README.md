Here is a concise addition for your `README.md`:

---

## API Endpoints

- `GET /api/products` — List all products
- `GET /api/products/{id}` — Get product details
- `POST /api/login` — User login
- `POST /api/register` — User registration
- `POST /api/logout` — User logout
- `GET /api/user` — Get authenticated user info
- (Add more as needed)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd <project-folder>
   ```

2. **Backend (Laravel):**
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```

3. **Frontend (React):**
   ```bash
   npm install
   npm run dev
   ```

## Authentication Flow

- Users register or log in via `/api/register` or `/api/login`.
- On success, a token is returned and stored (e.g., in localStorage).
- For authenticated requests, the token is sent in the `Authorization: Bearer <token>` header.
- Logout via `/api/logout` to invalidate the token.

## How to Run Backend and Frontend

- **Backend:**  
  Run `php artisan serve` (default: http://localhost:8000)

- **Frontend:**  
  In a separate terminal, run `npm run dev` inside `resources/js` (default: http://localhost:5173)

- The React frontend will proxy API requests to the Laravel backend.  
  (Configure Vite proxy if needed in `vite.config.js`.)

---
