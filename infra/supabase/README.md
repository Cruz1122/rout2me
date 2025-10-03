# Supabase Local Development Setup

## Prerequisites

Make sure you have Docker Desktop installed and running on your machine.

### Install Docker Desktop

1. Download from: https://docs.docker.com/desktop
2. Install and start Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker ps
   ```

## Installation

### Install Supabase CLI

```bash
# Check if Supabase CLI is installed
pnpm dlx supabase --version

# If not installed, install globally
npm i -g supabase
```

## Local Development

### 1. Initialize Supabase project

```bash
cd infra/supabase
supabase init
```

### 2. Start local Supabase services

```bash
supabase start
```

This will start:
- PostgreSQL database
- Supabase Studio (web interface)
- Auth service
- Storage service
- Edge Functions runtime
- API Gateway

### 3. Check services status

```bash
supabase status
```

Expected output should show all services running with their local URLs:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Studio
Once services are running, you can access Supabase Studio at `http://localhost:54323` for:
- Database schema management
- Table data viewing/editing  
- SQL editor
- Auth user management
- Storage file management

### 4. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env
```

The local development will use different URLs than production:
- Local API URL: `http://localhost:54321`
- Local Studio: `http://localhost:54323`

### 5. Stop services

When you're done developing:

```bash
supabase stop
```

## Useful Commands

### From project root:
- `pnpm supabase:start` - Start all Supabase services
- `pnpm supabase:stop` - Stop all services
- `pnpm supabase:status` - Check all services status
- `pnpm supabase:reset` - Reset database to initial state

### From infra/supabase directory:
- `supabase status` - Check services status
- `supabase logs` - View service logs
- `supabase gen types typescript --local` - Generate TypeScript types
- `supabase functions serve` - Start Edge Functions locally

## Troubleshooting

### Port conflicts
If you have port conflicts, you can customize ports in `supabase/config.toml`

### Docker issues
Make sure Docker is running:
```bash
docker --version
docker ps
```

### Reset everything
```bash
supabase stop
supabase start
```