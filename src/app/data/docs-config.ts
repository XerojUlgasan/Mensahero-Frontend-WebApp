export const languages = [
  { id: 'curl', label: 'cURL' },
  // Add more languages here in the future:
  // { id: 'node', label: 'Node.js' },
  // { id: 'react', label: 'React' },
] as const

export type LanguageId = (typeof languages)[number]['id']

export interface Field {
  field: string
  type: string
  required: boolean
  description: string
}

export interface CodeExample {
  description: string
  code: string
  language: string
}

export interface EndpointExample {
  label: string
  examples: Record<LanguageId, CodeExample>
  fields?: Field[]
}

export interface DocsSection {
  id: string
  label: string
  description: string
  method: string
  endpoint: string
  examples: EndpointExample[]
}

export const docsConfig: DocsSection[] = [
  {
    id: 'create-message',
    label: 'Create Message',
    description: 'Send an SMS message through your Server API and let our SMS gateway app handle the rest!',
    method: 'POST',
    endpoint: '/api/messages/create',
    examples: [
      {
        label: 'Request body',
        fields: [
          { field: 'apiKey', type: 'string', required: true, description: 'Your MensaHERO API key' },
          { field: 'to', type: 'string', required: true, description: 'Recipient phone number in E.164 format (e.g., +639123123123)' },
          { field: 'message', type: 'string', required: true, description: 'SMS message content to send' },
        ],
        examples: {
          curl: {
            description: 'Request body',
            code: `curl --location 'https://mensahero.onrender.com/api/messages/create' \\
--header 'Content-Type: application/json' \\
--data '{
  "apiKey": "YOUR_API_KEY",
  "to": "+639123123123",
  "message": "YOUR_MESSAGE"
}'`,
            language: 'bash',
          },
        },
      },
      {
        label: 'Response',
        examples: {
          curl: {
            description: 'Returns the created message object with a unique ID and initial status.',
            code: `{
    "message": "YOUR_MESSAGE",
    "receiver": "+639123123123",
    "sender": null,
    "api_id": "ec674b6b-22e9-4aa1-be1b-c709e835375d",
    "created_at": null,
    "id": "7d4a35d9-4048-4eb8-be24-28a248b9e7eb",
    "sent_at": null,
    "status": "pending"
}`,
            language: 'json',
          },
        },
      },
    ],
  },
  // Add more sections here in the future
]
