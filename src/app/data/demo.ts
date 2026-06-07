export type MessageStatus = 'delivered' | 'pending' | 'failed'
export type KeyStatus = 'active' | 'revoked'

export interface ApiKey {
  id: string
  name: string
  maskedValue: string
  fullValue: string
  created: string
  lastUsed: string
  status: KeyStatus
}

export interface Message {
  id: string
  to: string
  body: string
  keyId: string
  keyName: string
  status: MessageStatus
  sentAt: string
}

export interface Thread {
  id: string
  phone: string
  keyId: string
  keyName: string
  messages: Message[]
}

export interface ChartPoint {
  date: string
  sent: number
  delivered: number
}

export const demoUser = {
  name: 'Alex Rivera',
  email: 'alex@demo.com',
  initials: 'AR',
  role: 'Developer',
}

export const stats = {
  totalSent: 14823,
  deliveryRate: 97.4,
  failedPending: 382,
  activeAgents: 3,
  totalAgents: 5,
}

export const apiKeys: ApiKey[] = [
  {
    id: 'key_prod',
    name: 'Production',
    maskedValue: 'sk-live-••••••••••••abcd',
    fullValue: 'sk-live-Xk9mN3qP2rSt5uVwAbcd',
    created: 'Jan 15, 2026',
    lastUsed: '2 hours ago',
    status: 'active',
  },
  {
    id: 'key_stg',
    name: 'Staging',
    maskedValue: 'sk-live-••••••••••••efgh',
    fullValue: 'sk-live-Yp2nM8bQcDeFgHiJefgh',
    created: 'Feb 20, 2026',
    lastUsed: '1 day ago',
    status: 'active',
  },
  {
    id: 'key_mob',
    name: 'Mobile App',
    maskedValue: 'sk-live-••••••••••••ijkl',
    fullValue: 'sk-live-Zq4oL7cReStUvWxYijkl',
    created: 'Mar 10, 2026',
    lastUsed: '3 days ago',
    status: 'active',
  },
  {
    id: 'key_old',
    name: 'Old Key',
    maskedValue: 'sk-live-••••••••••••mnop',
    fullValue: 'sk-live-Ar5pK6dSfTgUhViWmnop',
    created: 'Aug 5, 2025',
    lastUsed: '45 days ago',
    status: 'revoked',
  },
]

export const chartData: ChartPoint[] = [
  { date: 'May 8', sent: 412, delivered: 398 },
  { date: 'May 9', sent: 380, delivered: 366 },
  { date: 'May 10', sent: 445, delivered: 431 },
  { date: 'May 11', sent: 321, delivered: 309 },
  { date: 'May 12', sent: 298, delivered: 286 },
  { date: 'May 13', sent: 467, delivered: 453 },
  { date: 'May 14', sent: 512, delivered: 497 },
  { date: 'May 15', sent: 489, delivered: 474 },
  { date: 'May 16', sent: 534, delivered: 518 },
  { date: 'May 17', sent: 421, delivered: 408 },
  { date: 'May 18', sent: 356, delivered: 344 },
  { date: 'May 19', sent: 398, delivered: 385 },
  { date: 'May 20', sent: 476, delivered: 461 },
  { date: 'May 21', sent: 523, delivered: 507 },
  { date: 'May 22', sent: 498, delivered: 483 },
  { date: 'May 23', sent: 445, delivered: 431 },
  { date: 'May 24', sent: 387, delivered: 375 },
  { date: 'May 25', sent: 312, delivered: 302 },
  { date: 'May 26', sent: 423, delivered: 410 },
  { date: 'May 27', sent: 567, delivered: 551 },
  { date: 'May 28', sent: 589, delivered: 572 },
  { date: 'May 29', sent: 545, delivered: 529 },
  { date: 'May 30', sent: 478, delivered: 463 },
  { date: 'May 31', sent: 512, delivered: 497 },
  { date: 'Jun 1', sent: 434, delivered: 420 },
  { date: 'Jun 2', sent: 398, delivered: 385 },
  { date: 'Jun 3', sent: 456, delivered: 442 },
  { date: 'Jun 4', sent: 523, delivered: 508 },
  { date: 'Jun 5', sent: 567, delivered: 551 },
  { date: 'Jun 6', sent: 543, delivered: 528 },
]

export const keyMessageCounts = [
  { name: 'Production', count: 8234, keyId: 'key_prod' },
  { name: 'Staging', count: 3891, keyId: 'key_stg' },
  { name: 'Mobile App', count: 2149, keyId: 'key_mob' },
  { name: 'Old Key', count: 549, keyId: 'key_old' },
]

export const threads: Thread[] = [
  {
    id: 'thread_1',
    phone: '+639171234567',
    keyId: 'key_prod',
    keyName: 'Production',
    messages: [
      { id: 'm1', to: '+639171234567', body: 'Your OTP is 847291. Valid for 5 minutes.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-06 14:32' },
      { id: 'm2', to: '+639171234567', body: 'Welcome to MensaHERO! Your account is now active.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-06 09:15' },
      { id: 'm3', to: '+639171234567', body: 'Your subscription renews in 3 days. No action needed.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-05 11:20' },
    ],
  },
  {
    id: 'thread_2',
    phone: '+639281234568',
    keyId: 'key_prod',
    keyName: 'Production',
    messages: [
      { id: 'm4', to: '+639281234568', body: 'Your package has been shipped. Track it at track.example.com', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-07 08:45' },
      { id: 'm5', to: '+639281234568', body: 'Your OTP is 293847. Valid for 5 minutes.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-06 16:30' },
      { id: 'm6', to: '+639281234568', body: 'Payment of ₱1,200 received. Thank you!', keyId: 'key_prod', keyName: 'Production', status: 'failed', sentAt: '2026-06-05 14:10' },
    ],
  },
  {
    id: 'thread_3',
    phone: '+639391234569',
    keyId: 'key_prod',
    keyName: 'Production',
    messages: [
      { id: 'm7', to: '+639391234569', body: 'Your appointment is tomorrow at 10:00 AM. Reply CONFIRM.', keyId: 'key_prod', keyName: 'Production', status: 'pending', sentAt: '2026-06-07 10:00' },
      { id: 'm8', to: '+639391234569', body: 'Reminder: your appointment is in 2 days.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-06 10:00' },
    ],
  },
  {
    id: 'thread_4',
    phone: '+639451234570',
    keyId: 'key_prod',
    keyName: 'Production',
    messages: [
      { id: 'm9', to: '+639451234570', body: 'Flash sale! 30% off all items today only.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-04 08:00' },
      { id: 'm10', to: '+639451234570', body: 'Your cart has items waiting. Complete your order!', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-03 15:30' },
      { id: 'm11', to: '+639451234570', body: 'Your OTP is 518294. Valid for 5 minutes.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-02 12:15' },
      { id: 'm12', to: '+639451234570', body: 'Order #ORD-4521 confirmed. Estimated delivery: Jun 10.', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-01 09:45' },
    ],
  },
  {
    id: 'thread_5',
    phone: '+14155551234',
    keyId: 'key_stg',
    keyName: 'Staging',
    messages: [
      { id: 'm13', to: '+14155551234', body: '[TEST] Hello from staging environment!', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-07 11:00' },
      { id: 'm14', to: '+14155551234', body: '[TEST] Your verification code is 123456', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-07 10:55' },
      { id: 'm15', to: '+14155551234', body: '[TEST] SMS delivery test #3 — retry check', keyId: 'key_stg', keyName: 'Staging', status: 'failed', sentAt: '2026-06-06 14:00' },
    ],
  },
  {
    id: 'thread_6',
    phone: '+14155559876',
    keyId: 'key_stg',
    keyName: 'Staging',
    messages: [
      { id: 'm16', to: '+14155559876', body: '[TEST] Integration test message', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-05 09:00' },
      { id: 'm17', to: '+14155559876', body: '[TEST] Retry test — pending queue', keyId: 'key_stg', keyName: 'Staging', status: 'pending', sentAt: '2026-06-05 09:05' },
    ],
  },
  {
    id: 'thread_7',
    phone: '+447700900123',
    keyId: 'key_stg',
    keyName: 'Staging',
    messages: [
      { id: 'm18', to: '+447700900123', body: '[TEST] UK number routing test', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-04 16:45' },
      { id: 'm19', to: '+447700900123', body: '[TEST] International routing check', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-04 16:46' },
      { id: 'm20', to: '+447700900123', body: '[TEST] Follow-up message batch', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-04 16:50' },
    ],
  },
  {
    id: 'thread_8',
    phone: '+639561234571',
    keyId: 'key_mob',
    keyName: 'Mobile App',
    messages: [
      { id: 'm21', to: '+639561234571', body: 'Welcome to the app! Your account is ready.', keyId: 'key_mob', keyName: 'Mobile App', status: 'delivered', sentAt: '2026-06-07 07:30' },
      { id: 'm22', to: '+639561234571', body: 'You have a new message from support.', keyId: 'key_mob', keyName: 'Mobile App', status: 'delivered', sentAt: '2026-06-06 12:00' },
    ],
  },
  {
    id: 'thread_9',
    phone: '+639671234572',
    keyId: 'key_mob',
    keyName: 'Mobile App',
    messages: [
      { id: 'm23', to: '+639671234572', body: 'Your password has been changed.', keyId: 'key_mob', keyName: 'Mobile App', status: 'delivered', sentAt: '2026-06-06 18:30' },
      { id: 'm24', to: '+639671234572', body: 'New login detected from iOS device.', keyId: 'key_mob', keyName: 'Mobile App', status: 'delivered', sentAt: '2026-06-05 22:15' },
      { id: 'm25', to: '+639671234572', body: 'Your OTP is 763412. Valid for 5 minutes.', keyId: 'key_mob', keyName: 'Mobile App', status: 'delivered', sentAt: '2026-06-05 22:14' },
    ],
  },
  {
    id: 'thread_10',
    phone: '+639781234573',
    keyId: 'key_mob',
    keyName: 'Mobile App',
    messages: [
      { id: 'm26', to: '+639781234573', body: 'Referral bonus of ₱50 credited to your account!', keyId: 'key_mob', keyName: 'Mobile App', status: 'delivered', sentAt: '2026-06-03 14:00' },
      { id: 'm27', to: '+639781234573', body: 'Daily challenge: Earn 2x points today!', keyId: 'key_mob', keyName: 'Mobile App', status: 'pending', sentAt: '2026-06-07 06:00' },
    ],
  },
]

export const recentMessages: Message[] = [
  { id: 'r1', to: '+639171234567', body: 'Your OTP is 847291', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-07 14:32' },
  { id: 'r2', to: '+639281234568', body: 'Your package has been shipped', keyId: 'key_prod', keyName: 'Production', status: 'delivered', sentAt: '2026-06-07 08:45' },
  { id: 'r3', to: '+639391234569', body: 'Your appointment is tomorrow', keyId: 'key_prod', keyName: 'Production', status: 'pending', sentAt: '2026-06-07 10:00' },
  { id: 'r4', to: '+14155551234', body: '[TEST] Hello from staging', keyId: 'key_stg', keyName: 'Staging', status: 'delivered', sentAt: '2026-06-07 11:00' },
  { id: 'r5', to: '+639281234568', body: 'Payment received. Thank you!', keyId: 'key_prod', keyName: 'Production', status: 'failed', sentAt: '2026-06-05 14:10' },
]
