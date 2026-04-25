# CodePVP

## Project Structure good
```shell
.
├── backend/ # Node.js + Express backend
├── frontend/ # React + TypeScript + Vite frontend
├── .gitignore
└── README.md
```

## Setup

### Install dependencies
```bash
# Root
npm install

# Backend
cd backend && npm install
```

## Environment Variables
Copy the `.env.example` file in the `backend/` directory to `.env`:

```bash
cp backend/.env.example backend/.env
```
Then update the values as needed for your local setup.

## Development
```bash
npm run dev
```

### Defaults
- Frontend: http://localhost:5173 

- Backend: http://localhost:3000



## Scripts
| Command             | Description                                          |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Runs both frontend and backend concurrently          |
| `npm run build`     | Builds frontend for production                       |
| `npm run dev:frontend` | Runs only the frontend in development mode         |
| `npm run dev:backend`  | Runs only the backend in development mode (from root) |

