/** Stand-in for legalContent.ts — support contact details. */

export const supportContact = {
  email: "support@magizh.com",
  phone: "+91 44 4000 1234",
  whatsapp: "+91 98400 12345",
  hours: [
    { days: "Monday – Friday", time: "9:00 AM – 8:00 PM IST" },
    { days: "Saturday", time: "10:00 AM – 5:00 PM IST" },
    { days: "Sunday & public holidays", time: "Closed" },
  ],
  responseTime: "We usually reply within one business day.",
}

/** Whether legal/support copy is still in draft (drives DraftNotice). */
export const legalIsDraft = true
