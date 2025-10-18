-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  has_subscription BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create funds table
CREATE TABLE IF NOT EXISTS funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(15,2),
  monthly_pledge NUMERIC(15,2),
  current_balance NUMERIC(15,2) DEFAULT 0,
  invested_balance NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fund_members table
CREATE TABLE IF NOT EXISTS fund_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  approved BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(fund_id, member_id)
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payhero_tx_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  reason TEXT,
  payhero_disbursement_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE CASCADE NOT NULL,
  approver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(withdrawal_id, approver_id)
);

-- Create mmf_profits table
CREATE TABLE IF NOT EXISTS mmf_profits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  profit_amount NUMERIC(15,2) NOT NULL,
  platform_fee NUMERIC(15,2) NOT NULL,
  net_profit NUMERIC(15,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create revenue table
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('subscription', 'MMF Fee')),
  amount NUMERIC(15,2) NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table for tracking subscription payments
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 100.00,
  payhero_tx_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_funds_owner_id ON funds(owner_id);
CREATE INDEX IF NOT EXISTS idx_fund_members_fund_id ON fund_members(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_members_member_id ON fund_members(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_fund_id ON contributions(fund_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_fund_id ON withdrawals(fund_id);
CREATE INDEX IF NOT EXISTS idx_approvals_withdrawal_id ON approvals(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_mmf_profits_fund_id ON mmf_profits(fund_id);
CREATE INDEX IF NOT EXISTS idx_revenue_source ON revenue(source);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmf_profits ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Funds policies
CREATE POLICY "Users can view funds they own or are members of" ON funds
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT member_id FROM fund_members WHERE fund_id = funds.id)
    );

CREATE POLICY "Users can create funds" ON funds
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Fund owners can update their funds" ON funds
    FOR UPDATE USING (auth.uid() = owner_id);

-- Fund members policies
CREATE POLICY "Users can view fund members for funds they're part of" ON fund_members
    FOR SELECT USING (
        auth.uid() = member_id OR 
        auth.uid() IN (SELECT owner_id FROM funds WHERE id = fund_id)
    );

CREATE POLICY "Fund owners can manage members" ON fund_members
    FOR ALL USING (
        auth.uid() IN (SELECT owner_id FROM funds WHERE id = fund_id)
    );

-- Contributions policies
CREATE POLICY "Users can view contributions for funds they're part of" ON contributions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT owner_id FROM funds WHERE id = fund_id) OR
        auth.uid() IN (SELECT member_id FROM fund_members WHERE fund_id = contributions.fund_id)
    );

CREATE POLICY "Users can create contributions" ON contributions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawals policies
CREATE POLICY "Users can view withdrawals for funds they're part of" ON withdrawals
    FOR SELECT USING (
        auth.uid() = requester_id OR 
        auth.uid() IN (SELECT owner_id FROM funds WHERE id = fund_id) OR
        auth.uid() IN (SELECT member_id FROM fund_members WHERE fund_id = withdrawals.fund_id)
    );

CREATE POLICY "Fund members can create withdrawal requests" ON withdrawals
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id AND
        auth.uid() IN (SELECT member_id FROM fund_members WHERE fund_id = withdrawals.fund_id)
    );

-- Approvals policies
CREATE POLICY "Users can view approvals for withdrawals they're involved in" ON approvals
    FOR SELECT USING (
        auth.uid() = approver_id OR 
        auth.uid() IN (SELECT requester_id FROM withdrawals WHERE id = withdrawal_id)
    );

CREATE POLICY "Approvers can update their approvals" ON approvals
    FOR UPDATE USING (auth.uid() = approver_id);

CREATE POLICY "System can create approvals" ON approvals
    FOR INSERT WITH CHECK (true);

-- MMF profits policies
CREATE POLICY "Users can view MMF profits for their funds" ON mmf_profits
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM funds WHERE id = fund_id) OR
        auth.uid() IN (SELECT member_id FROM fund_members WHERE fund_id = mmf_profits.fund_id)
    );

-- Revenue policies (admin only)
CREATE POLICY "Only authenticated users can view revenue" ON revenue
    FOR SELECT USING (auth.role() = 'authenticated');

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
