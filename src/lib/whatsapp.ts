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
  category: 'Real Estate' | 'Marketing' | 'Support' | 'Custom';
}

export const PREMADE_TEMPLATES: Template[] = [
  {
    id: 're-1',
    name: 'Property Inquiry',
    category: 'Real Estate',
    content: 'Hello {{Name}},\n\nThank you for inquiring about the property at {{Location}}. Would you like to schedule a site visit this weekend?'
  },
  {
    id: 're-2',
    name: 'Site Visit Follow-up',
    category: 'Real Estate',
    content: 'Hi {{Name}},\n\nIt was great meeting you at the site today. What are your thoughts on the property? Let me know if you have any questions.'
  },
  {
    id: 'm-1',
    name: 'Special Offer',
    category: 'Marketing',
    content: 'Hey {{Name}}!\n\nWe have an exclusive offer just for you. Get 20% off on your next purchase using code: WELCOME20. Valid until Sunday!'
  },
  {
    id: 's-1',
    name: 'Support Check-in',
    category: 'Support',
    content: 'Hello {{Name}},\n\nI hope your issue was resolved to your satisfaction. Is there anything else I can help you with today?'
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
  status: 'completed' | 'scheduled' | 'running';
  scheduledTime?: string;
}

export interface CampaignHistory {
  campaigns: Campaign[];
}

export function formatPhoneNumber(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // If it doesn't start with a country code, assume India (91) as a default or just leave it
  // For WhatsApp, it needs the country code without '+'
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  // Using web.whatsapp.com directly skips the landing page on desktop
  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
}

export function replacePlaceholders(template: string, contact: Contact): string {
  let message = template;
  Object.keys(contact).forEach((key) => {
    const value = contact[key];
    const placeholder = `{{${key}}}`;
    // Case insensitive replacement
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    message = message.replace(regex, value || '');
  });
  return message;
}
