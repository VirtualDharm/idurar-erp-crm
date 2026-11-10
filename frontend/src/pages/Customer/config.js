// Same stages and colours as the Leads board (pages/Lead/index.jsx).
const STAGES = [
  { value: 'New', label: 'New', color: 'blue' },
  { value: 'Contacted', label: 'Contacted', color: 'cyan' },
  { value: 'Survey Scheduled', label: 'Survey Scheduled', color: 'purple' },
  { value: 'Quote Sent', label: 'Quote Sent', color: 'gold' },
  { value: 'Negotiation', label: 'Negotiation', color: 'orange' },
  { value: 'Won', label: 'Won', color: 'green' },
  { value: 'Lost', label: 'Lost', color: 'red' },
];

export const fields = {
  name: {
    type: 'string',
  },
  stage: {
    type: 'select',
    label: 'Stage',
    options: STAGES,
    renderAsTag: true,
    defaultValue: 'New',
  },
  phone: {
    type: 'phone',
  },
  address: {
    type: 'string',
  },
  salesPerson: {
    type: 'string',
    label: 'Sales person',
  },
  source: {
    type: 'string',
    label: 'Source',
    disableForTable: true,
  },
  country: {
    type: 'country',
    disableForTable: true,
  },
  email: {
    type: 'email',
    disableForTable: true,
  },
  notes: {
    type: 'textarea',
    label: 'Notes',
    disableForTable: true,
  },
};
