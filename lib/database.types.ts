// Database types
export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string
            full_name: string | null
            phone: string | null
            has_subscription: boolean
            created_at: string
          }
          Insert: {
            id: string
            full_name?: string | null
            phone?: string | null
            has_subscription?: boolean
            created_at?: string
          }
          Update: {
            id?: string
            full_name?: string | null
            phone?: string | null
            has_subscription?: boolean
            created_at?: string
          }
        }
        funds: {
          Row: {
            id: string
            owner_id: string
            title: string
            description: string | null
            target_amount: number | null
            monthly_pledge: number | null
            current_balance: number
            status: string
            start_date: string | null
            end_date: string | null
            created_at: string
          }
          Insert: {
            id?: string
            owner_id: string
            title: string
            description?: string | null
            target_amount?: number | null
            monthly_pledge?: number | null
            current_balance?: number
            status?: string
            start_date?: string | null
            end_date?: string | null
            created_at?: string
          }
          Update: {
            id?: string
            owner_id?: string
            title?: string
            description?: string | null
            target_amount?: number | null
            monthly_pledge?: number | null
            current_balance?: number
            status?: string
            start_date?: string | null
            end_date?: string | null
            created_at?: string
          }
        }
        fund_members: {
          Row: {
            id: string
            fund_id: string
            member_id: string
            role: string
            approved: boolean
            invited_at: string
            approved_at: string | null
          }
          Insert: {
            id?: string
            fund_id: string
            member_id: string
            role?: string
            approved?: boolean
            invited_at?: string
            approved_at?: string | null
          }
          Update: {
            id?: string
            fund_id?: string
            member_id?: string
            role?: string
            approved?: boolean
            invited_at?: string
            approved_at?: string | null
          }
        }
        contributions: {
          Row: {
            id: string
            fund_id: string
            user_id: string
            amount: number
            payhero_tx_id: string | null
            status: string
            created_at: string
          }
          Insert: {
            id?: string
            fund_id: string
            user_id: string
            amount: number
            payhero_tx_id?: string | null
            status?: string
            created_at?: string
          }
          Update: {
            id?: string
            fund_id?: string
            user_id?: string
            amount?: number
            payhero_tx_id?: string | null
            status?: string
            created_at?: string
          }
        }
        withdrawals: {
          Row: {
            id: string
            fund_id: string
            requester_id: string
            amount: number
            payhero_disbursement_id: string | null
            status: string
            created_at: string
            completed_at: string | null
          }
          Insert: {
            id?: string
            fund_id: string
            requester_id: string
            amount: number
            payhero_disbursement_id?: string | null
            status?: string
            created_at?: string
            completed_at?: string | null
          }
          Update: {
            id?: string
            fund_id?: string
            requester_id?: string
            amount?: number
            payhero_disbursement_id?: string | null
            status?: string
            created_at?: string
            completed_at?: string | null
          }
        }
        approvals: {
          Row: {
            id: string
            withdrawal_id: string
            approver_id: string
            approved: boolean
            approved_at: string | null
          }
          Insert: {
            id?: string
            withdrawal_id: string
            approver_id: string
            approved?: boolean
            approved_at?: string | null
          }
          Update: {
            id?: string
            withdrawal_id?: string
            approver_id?: string
            approved?: boolean
            approved_at?: string | null
          }
        }
        mmf_profits: {
          Row: {
            id: string
            fund_id: string
            profit_amount: number
            period_start: string
            period_end: string
            created_at: string
          }
          Insert: {
            id?: string
            fund_id: string
            profit_amount: number
            period_start: string
            period_end: string
            created_at?: string
          }
          Update: {
            id?: string
            fund_id?: string
            profit_amount?: number
            period_start?: string
            period_end?: string
            created_at?: string
          }
        }
        revenue: {
          Row: {
            id: string
            source: string
            amount: number
            created_at: string
          }
          Insert: {
            id?: string
            source: string
            amount: number
            created_at?: string
          }
          Update: {
            id?: string
            source?: string
            amount?: number
            created_at?: string
          }
        }
      }
    }
  }