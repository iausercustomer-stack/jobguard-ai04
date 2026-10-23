import { SampleMessage } from '../types';

export const BUILTIN_SAMPLES: SampleMessage[] = [
  {
    id: 'suspicious-fee-scam',
    label: 'Suspicious Offer (Upfront Fee + Impersonation + Urgency)',
    kind: 'suspicious',
    company_name: 'Tata Consultancy Services (TCS)',
    recruiter_email: 'tcs.direct.hr.onboarding2026@gmail.com',
    job_url: 'http://bit.ly/tcs-fast-joining-2026',
    message_text:
      'CONGRATULATIONS! Your resume has been shortlisted for Direct Joining as Junior Software Associate at Tata Consultancy Services (TCS) with a package of Rs. 65,000 per month (Work From Home, only 2 hours daily). No interview required! Guaranteed 100% selection under special campus quota.\n\nTo generate your confirmed Offer Letter and dispatch your company MacBook, pay the refundable security deposit and laptop registration fee of Rs. 2,499 within 30 minutes via UPI. After payment, share your transaction screenshot and verification OTP on http://bit.ly/tcs-fast-joining-2026 or Telegram https://t.me/tcs_hr_desk_2026. Hurry—only 2 seats left today!',
    expected_note:
      'Triggers upfront fee, guaranteed selection, urgency, unrealistic pay, sensitive OTP request, shortened/Telegram links, brand impersonation domain mismatch, and free webmail indicators.',
  },
  {
    id: 'legitimate-campus-role',
    label: 'Legitimate Vacancy (Official Domain + Anti-Fee Notice)',
    kind: 'legitimate',
    company_name: 'Infosys',
    recruiter_email: 'campus.recruitment@infosys.com',
    job_url: 'https://www.infosys.com/careers/graduates.html',
    message_text:
      'Infosys Campus Recruitment 2026 — Systems Engineer Role (Lucknow / Bengaluru / Hyderabad).\n\nEligibility: B.Tech / B.E. / MCA graduates (2026 batch) with strong fundamentals in data structures, algorithms, relational databases, and software engineering.\nSelection Process: Round 1 Online Coding & Aptitude Assessment followed by Technical and HR Interviews.\nCompensation: INR 3.6 LPA – 6.25 LPA based on assessment performance.\n\nPlease apply directly using your candidate profile on https://www.infosys.com/careers/graduates.html.\nImportant Notice: Infosys does not charge any fee, security deposit, or training charge at any stage of its recruitment process, and never asks candidates for banking passwords or OTPs.',
    expected_note:
      'Aligns with Infosys official domain, includes standard multi-round selection details, and recognizes the anti-fee notice without false-positive fee triggers.',
  },
  {
    id: 'ambiguous-local-startup',
    label: 'Ambiguous Local Listing (Free Email + Unverified Company)',
    kind: 'ambiguous',
    company_name: 'Gomti Tech Solutions Pvt Ltd',
    recruiter_email: 'hr.gomtitech.lucknow@outlook.com',
    job_url: '',
    message_text:
      'Hi Candidate, we saw your profile and have an opening for a React & Python Intern at our Gomti Nagar, Lucknow office. Stipend is Rs. 12,000/month during the 3-month internship with a full-time conversion review after completion. There will be a 45-minute coding test and an in-person technical interview at our office next Tuesday. Reply to hr.gomtitech.lucknow@outlook.com if you would like the interview schedule.',
    expected_note:
      'Demonstrates balanced handling: flags free webmail and missing official website as low-severity unverified caution indicators rather than falsely labeling a small local business fraudulent.',
  },
];
