export const COMMAND_HISTORY_KEY = 'td_terminal_command_history';
export const MAX_COMMAND_HISTORY = 50;

export const TERMINAL_COMMANDS = [
  {
    command: '/tower help',
    description: 'List available tower defense commands.'
  },
  {
    command: '/tower upgrade',
    description: 'Upgrade the selected tower.'
  },
  {
    command: '/tower upgrade --special',
    description: 'Apply a special upgrade to the selected tower.'
  },
  {
    command: '/tower sell',
    description: 'Sell the selected tower.'
  }
];