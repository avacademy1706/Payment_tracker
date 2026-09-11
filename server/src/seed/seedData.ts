import type { PaymentMode } from "../../../shared/types/enums";

export interface SeedClient {
  name: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  monthlyFee: number;
  defaultDueDay: number;
  notes?: string;
}

export const SEED_CLIENTS: SeedClient[] = [
  {
    name: "Rohan Mehta",
    company: "",
    phone: "+91 98210 12345",
    email: "rohan.mehta@gmail.com",
    service: "Web Development Retainer",
    monthlyFee: 45000,
    defaultDueDay: 5,
  },
  {
    name: "Priya Sharma",
    company: "Sharma Consulting",
    phone: "+91 98123 45678",
    email: "priya.sharma@sharmaconsulting.in",
    service: "Digital Marketing",
    monthlyFee: 25000,
    defaultDueDay: 1,
  },
  {
    name: "Amit Verma",
    company: "Verma & Associates",
    phone: "+91 99001 12233",
    email: "amit.verma@vermaassociates.com",
    service: "Accounting Services",
    monthlyFee: 18000,
    defaultDueDay: 10,
  },
  {
    name: "Sneha Iyer",
    company: "",
    phone: "+91 98450 98450",
    email: "sneha.iyer@yahoo.com",
    service: "Python Coaching",
    monthlyFee: 12000,
    defaultDueDay: 20,
  },
  {
    name: "Karan Malhotra",
    company: "Malhotra Textiles Pvt Ltd",
    phone: "+91 98711 22334",
    email: "karan@malhotratextiles.com",
    service: "IT Support & Maintenance",
    monthlyFee: 60000,
    defaultDueDay: 5,
  },
  {
    name: "Anjali Nair",
    company: "Bright Minds Institute",
    phone: "+91 99955 66778",
    email: "anjali.nair@brightminds.edu.in",
    service: "Curriculum Consulting",
    monthlyFee: 30000,
    defaultDueDay: 3,
  },
  {
    name: "Vikram Singh",
    company: "Singh Enterprises",
    phone: "+91 98122 33445",
    email: "vikram.singh@singhenterprises.co.in",
    service: "Business Strategy Consulting",
    monthlyFee: 75000,
    defaultDueDay: 25,
  },
  {
    name: "Neha Gupta",
    company: "",
    phone: "+91 98877 66554",
    email: "neha.gupta@outlook.com",
    service: "Career Coaching",
    monthlyFee: 8000,
    defaultDueDay: 15,
  },
  {
    name: "Rajesh Kumar",
    company: "Kumar Traders",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@kumartraders.in",
    service: "Bookkeeping Services",
    monthlyFee: 15000,
    defaultDueDay: 5,
  },
  {
    name: "Divya Reddy",
    company: "TechNova Solutions",
    phone: "+91 98451 23456",
    email: "divya.reddy@technova.io",
    service: "SEO & Content Strategy",
    monthlyFee: 40000,
    defaultDueDay: 1,
  },
  {
    name: "Arjun Kapoor",
    company: "",
    phone: "+91 99005 56677",
    email: "arjun.kapoor@gmail.com",
    service: "Guitar Lessons",
    monthlyFee: 6000,
    defaultDueDay: 10,
  },
  {
    name: "Meera Joshi",
    company: "Joshi Realty",
    phone: "+91 98223 34455",
    email: "meera.joshi@joshirealty.com",
    service: "Social Media Management",
    monthlyFee: 22000,
    defaultDueDay: 28,
  },
];

export const PAYMENT_MODE_ROTATION: PaymentMode[] = [
  "UPI",
  "Bank Transfer",
  "Cash",
  "Card",
  "Cheque",
  "UPI",
  "Bank Transfer",
  "Other",
];

/** Current-month behaviour per client, indexed the same as SEED_CLIENTS. */
export const CURRENT_MONTH_PATTERN: Array<"full" | "partial" | "none"> = [
  "none", // Rohan Mehta -> Overdue (due day 5, already passed)
  "full", // Priya Sharma -> Paid
  "partial", // Amit Verma -> partial but overdue (due day 10, already passed)
  "none", // Sneha Iyer -> Pending (due day 20, not yet passed)
  "full", // Karan Malhotra -> Paid
  "none", // Anjali Nair -> Overdue (due day 3, already passed)
  "none", // Vikram Singh -> Pending (due day 25, not yet passed)
  "partial", // Neha Gupta -> Partial (due day 15, not yet passed)
  "full", // Rajesh Kumar -> Paid
  "full", // Divya Reddy -> Paid
  "none", // Arjun Kapoor -> Overdue (due day 10, already passed)
  "none", // Meera Joshi -> Pending (due day 28, not yet passed)
];

/** Clients (by index) that also carry one historical overdue/partial invoice for realism. */
export const HISTORICAL_PARTIAL_MONTH_OFFSET: Record<number, number> = {
  0: 1, // Rohan Mehta — last month also left partially paid
  2: 2, // Amit Verma — two months ago also left partially paid
};
