export const STATUS = [
  { label: 'Pending',   value: 'pending'   },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Posted',    value: 'posted'    },
  { label: 'Rejected',  value: 'rejected'  },
  { label: 'Archived',  value: 'archived'  },
];

// If you want different words in different UIs:
export const STATUS_LABELS = {
  pending:   'Pending',
  scheduled: 'Schedule', // or 'Scheduled' if you prefer
  posted:    'Post',     // or 'Posted'
  rejected:  'Reject',
  archived:  'Archive',
};