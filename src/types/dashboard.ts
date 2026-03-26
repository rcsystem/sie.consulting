export interface DashboardMetric {
  title: string;
  value: number;
  description: string;
}

export interface DashboardEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  color?: string;
  department?: string | null;
  description?: string | null;
}

export interface DashboardResponse {
  user: {
    id: number;
    full_name: string;
    email: string;
    role: string | null;
    department?: string | null;
    position?: string | null;
  };
  metrics: DashboardMetric[];
  calendar: {
    month: number;
    year: number;
    events: DashboardEvent[];
  };
  upcoming_events: DashboardEvent[];
}