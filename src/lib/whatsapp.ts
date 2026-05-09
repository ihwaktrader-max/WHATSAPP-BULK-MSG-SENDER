export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  group?: string;
  [key: string]: any; // For extra columns in Excel
}

export interface Template {
  id: string;
  name: string;
  content: string;
  category: 'Festival' | 'Sale/Offer' | 'Reminder' | 'Welcome' | 'Follow-up' | 'Other/Custom';
}

export const PREMADE_TEMPLATES: Template[] = [
  {
    id: 'festival-1',
    name: 'Diwali Greetings',
    category: 'Festival',
    content: '🪔 Wishing you and your family a very Happy Diwali, {name}! May this festival of lights bring health, wealth, and prosperity to your life. ✨'
  },
  {
    id: 'sale-1',
    name: 'Sale Alert 50% Off',
    category: 'Sale/Offer',
    content: '🔥 MEGA SALE ALERT! 🔥\n\nHey {name}, your favorite items are now at 50% OFF! 🛍️\n\nUse code: FESTIVE50 at checkout.\nShop now: {link}\n\nDon\'t miss out!'
  },
  {
    id: 'reminder-1',
    name: 'Payment Reminder',
    category: 'Reminder',
    content: 'Hello {name}, this is a gentle reminder regarding your pending payment of {amount} for order {order_id} due on {date}.\n\nPlease ignore if already paid.'
  },
  {
    id: 'welcome-1',
    name: 'Welcome Message',
    category: 'Welcome',
    content: 'Welcome to the family, {name}! 🎊 We\'re thrilled to have you here. \n\nStarting today, you will receive exclusive updates and early access to our new launches. Stay tuned!'
  }
];

export interface Campaign {
  id: string;
  name: string;
  date: string;
  totalContacts: number;
  sent: number;
  failed: number;
  pending: number;
  templatePreview: string;
  status: 'completed' | 'scheduled' | 'running' | 'cancelled';
  scheduledTime?: string;
  reportData?: Contact[];
}

export type ScheduleStatus = 'upcoming' | 'sending' | 'completed' | 'cancelled';

export interface ScheduledCampaign {
  id: string;
  name: string;
  scheduledTime: string;
  contacts: Contact[];
  template: string;
  status: ScheduleStatus;
  createdAt: string;
  timezone: string;
}

export interface BlacklistEntry {
  id: string;
  phone: string;
  reason?: string;
  addedAt: string;
}

export interface CampaignHistory {
  campaigns: Campaign[];
}

export interface ValidationReport {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  invalidEntries: { phone: string; name: string; reason: string }[];
}

export function validatePhoneNumber(phone: string): { 
  valid: boolean; 
  formatted: string; 
  reason?: string 
} {
  // Remove all non-numeric characters
  const clean = phone.replace(/\D/g, '');
  
  if (!clean) return { valid: false, formatted: phone, reason: 'Empty row/value' };

  // Common Indian Number logic (10 digits)
  if (clean.length === 10) {
    return { valid: true, formatted: `91${clean}` };
  }

  // If starts with 0 and is 11 digits (Indian context)
  if (clean.length === 11 && clean.startsWith('0')) {
    return { valid: true, formatted: `91${clean.substring(1)}` };
  }

  // Full number including country code (e.g., 91xxxxxxxxxx)
  if (clean.length >= 11 && clean.length <= 15) {
    return { valid: true, formatted: clean };
  }

  return { 
    valid: false, 
    formatted: phone, 
    reason: clean.length < 10 ? 'Too short' : 'Incorrect format' 
  };
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const validation = validatePhoneNumber(phone);
  const formattedPhone = validation.valid ? validation.formatted : phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  // Using web.whatsapp.com directly skips the landing page on desktop
  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
}

export function replacePlaceholders(template: string, contact: Contact): string {
  let message = template;
  Object.keys(contact).forEach((key) => {
    const value = contact[key];
    // Match {key} or {{key}} case-insensitively
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{?\\{${escapedKey}\\}\\}?`, 'gi');
    message = message.replace(regex, value || '');
  });
  return message;
}
