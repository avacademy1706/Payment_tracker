import { formatCurrency, formatDate } from "@/lib/utils";

function reminderMessage(clientName: string, amount: number, invoiceNumber: string, dueDate: string): string {
  return `Hello ${clientName}, this is a reminder that payment of ${formatCurrency(amount)} for ${invoiceNumber} is due on ${formatDate(
    dueDate
  )}. Please let us know once the payment has been completed. Thank you.`;
}

function normalizePhoneForWhatsApp(phone: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  return digitsOnly;
}

export function buildWhatsAppReminderUrl(phone: string, clientName: string, amount: number, invoiceNumber: string, dueDate: string): string {
  const message = reminderMessage(clientName, amount, invoiceNumber, dueDate);
  const number = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildEmailReminderUrl(email: string, clientName: string, amount: number, invoiceNumber: string, dueDate: string): string {
  const message = reminderMessage(clientName, amount, invoiceNumber, dueDate);
  const subject = `Payment Reminder — ${invoiceNumber}`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
