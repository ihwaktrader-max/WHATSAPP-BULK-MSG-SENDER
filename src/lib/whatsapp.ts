export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  [key: string]: any; // For extra columns in Excel
}

export interface Template {
  id: string;
  name: string;
  content: string;
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
