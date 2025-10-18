# MedPool - Purpose-Driven Savings Platform

A Next.js 14 application for creating purpose-driven savings funds where users can save for life events with trusted family and friends. Features automatic investment in Money Market Funds and unanimous approval for withdrawals.

## Features

- **User Authentication**: Supabase Auth with email/password
- **Fund Management**: Create and manage savings funds for specific purposes
- **Member Collaboration**: Invite trusted family and friends to join funds
- **Payment Processing**: Payhero integration for deposits and withdrawals
- **Auto-Investment**: Automatic investment in Money Market Funds (MMF)
- **Unanimous Approval**: All fund members must approve withdrawals
- **Profit Tracking**: Monthly MMF profit simulation with platform fees
- **Subscription Model**: One-time Ksh 100 subscription + 5% MMF profit fee

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Payments**: Payhero API (mocked for development)
- **UI Components**: Radix UI, Lucide React icons

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd med-pool
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Payhero Configuration
PAYHERO_API_KEY=your_payhero_api_key
PAYHERO_WEBHOOK_SECRET=your_payhero_webhook_secret
PAYHERO_BASE_URL=https://api.payhero.co.ke

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (for notifications)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL schema from `supabase-schema.sql` to create all tables and policies
4. Copy your project URL and anon key to the environment variables

### 4. Database Schema

The application uses the following main tables:

- `profiles` - User profiles extending Supabase auth
- `funds` - Savings funds with target amounts and balances
- `fund_members` - Fund membership and approval status
- `contributions` - User contributions to funds
- `withdrawals` - Withdrawal requests requiring approval
- `approvals` - Member approval records for withdrawals
- `mmf_profits` - Monthly MMF profit records
- `revenue` - Platform revenue tracking
- `subscriptions` - User subscription records

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Routes

### Authentication
- `POST /api/auth/subscribe` - Create Payhero subscription checkout

### Webhooks
- `POST /api/webhooks/payhero` - Handle Payhero payment webhooks

### Funds
- `GET /api/funds` - List user's funds
- `POST /api/funds` - Create new fund
- `GET /api/funds/[id]` - Get fund details
- `PUT /api/funds/[id]` - Update fund
- `POST /api/funds/[id]/contribute` - Create contribution checkout
- `POST /api/funds/[id]/withdraw` - Request withdrawal

### Withdrawals
- `POST /api/withdrawals/[id]/approve` - Approve/reject withdrawal

### Admin
- `GET /api/admin/revenue` - Get platform revenue summary
- `POST /api/admin/simulate-mmf` - Trigger MMF profit simulation

## Key Features Implementation

### 1. Fund Creation
- Users must have an active subscription to create funds
- Funds can have target amounts, monthly pledges, and timelines
- Members can be invited via email

### 2. Payment Processing
- Payhero integration for secure payments
- Webhook handling for payment confirmations
- Automatic fund balance updates

### 3. MMF Investment
- Monthly profit simulation (0.5% - 1% return)
- 5% platform fee on profits
- Automatic balance updates

### 4. Withdrawal System
- Unanimous approval required from all fund members
- Payhero disbursement integration
- Status tracking throughout the process

### 5. Subscription Model
- One-time Ksh 100 subscription fee
- Required for fund creation and management
- Revenue tracking for platform insights

## Development Notes

### Payhero Integration
The current implementation includes a mock Payhero service for development. In production:

1. Replace mock responses with actual Payhero API calls
2. Implement proper webhook signature verification
3. Add proper error handling and retry logic
4. Configure production webhook URLs

### MMF Simulation
The MMF profit simulation is currently manual. In production:

1. Set up a scheduled job (cron, Supabase Edge Function, or external service)
2. Run monthly to calculate and distribute profits
3. Add proper error handling and logging
4. Consider real MMF integration

### Security Considerations
- Implement proper admin role checking
- Add rate limiting to API routes
- Validate all user inputs
- Implement proper CORS policies
- Add request logging and monitoring

### Notifications
Currently, notifications are not implemented. Consider adding:
- Email notifications for fund invitations
- SMS notifications for withdrawal requests
- In-app notification system
- Push notifications for mobile users

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Real Payhero integration
- [ ] Email/SMS notifications
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-currency support
- [ ] Integration with real MMF providers
- [ ] Automated compliance reporting
- [ ] Advanced fund types (recurring, goal-based)