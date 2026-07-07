import { useCallback } from 'react';

export default function useTowerDefenseTerminalHelp({
  addTerminalSystemMessage,
  allowStdStreams = false,
}) {
  const handleHelpOverview = useCallback(() => {
    addTerminalSystemMessage(
      'SYSTEM',
      'Terminal commands: /tower, /deployable, /game, /code, /help'
    );
    addTerminalSystemMessage(
      'SYSTEM',
      'Type /tower help, /deployable help, /game help, or /code help for details.'
    );
    addTerminalSystemMessage(
      'SYSTEM',
      'Topic help: /help tower upgrade | /help deployable buy | /help code test'
    );
  }, [addTerminalSystemMessage]);

  const handleTowerHelp = useCallback(
    (topic = 'overview') => {
      const normalized = (topic || 'overview').toLowerCase();
      if (normalized === 'overview') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/tower list | /tower info <id> | /tower buy <id> --confirm'
        );
        addTerminalSystemMessage(
          'SYSTEM',
          '/tower upgrade | /tower upgrade --special | /tower sell | /tower selected | /tower placed | /tower cancel'
        );
        addTerminalSystemMessage(
          'SYSTEM',
          'Examples: /tower info ForLoop | /tower buy Function --confirm | /tower buy Burst --confirm'
        );
        return;
      }

      if (normalized === 'list') {
        addTerminalSystemMessage('SYSTEM', '/tower list → shows all available tower IDs.');
        addTerminalSystemMessage('SYSTEM', 'Example: /tower list');
        return;
      }

      if (normalized === 'info') {
        addTerminalSystemMessage('SYSTEM', '/tower info <id> → shows cost + description.');
        addTerminalSystemMessage('SYSTEM', 'Examples: /tower info ForLoop | /tower info Burst');
        return;
      }

      if (normalized === 'buy') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/tower buy <id> --confirm → reserves a tower for placement.'
        );
        addTerminalSystemMessage(
          'SYSTEM',
          'Examples: /tower buy Function --confirm | /tower buy Blast --confirm'
        );
        return;
      }

      if (normalized === 'upgrade') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/tower upgrade → upgrades the currently selected tower.'
        );
        addTerminalSystemMessage('SYSTEM', 'Example: /tower select 12 → /tower upgrade');
        addTerminalSystemMessage(
          'SYSTEM',
          'Tip: use /tower placed to find IDs and /tower selected to confirm selection.'
        );
        return;
      }

      if (normalized === 'upgrade-special' || normalized === 'special') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/tower upgrade --special → applies the special upgrade to the selected tower.'
        );
        addTerminalSystemMessage('SYSTEM', 'Example: /tower select 12 → /tower upgrade --special');
        return;
      }

      if (normalized === 'sell') {
        addTerminalSystemMessage('SYSTEM', '/tower sell → sells the selected tower.');
        addTerminalSystemMessage('SYSTEM', 'Example: /tower select 12 → /tower sell');
        return;
      }

      if (normalized === 'select') {
        addTerminalSystemMessage('SYSTEM', '/tower select <id> → selects a tower by ID.');
        addTerminalSystemMessage('SYSTEM', 'Example: /tower select 12');
        return;
      }

      if (normalized === 'selected') {
        addTerminalSystemMessage('SYSTEM', '/tower selected → shows the currently selected tower.');
        return;
      }

      if (normalized === 'placed') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/tower placed → lists towers with IDs and grid coords.'
        );
        return;
      }

      if (normalized === 'cancel') {
        addTerminalSystemMessage('SYSTEM', '/tower cancel → cancels the current placement mode.');
        return;
      }

      addTerminalSystemMessage(
        'WARNING',
        'Unknown tower help topic. Try: /tower help or /help tower'
      );
    },
    [addTerminalSystemMessage]
  );

  const handleDeployableHelp = useCallback(
    (topic = 'overview') => {
      const normalized = (topic || 'overview').toLowerCase();
      if (normalized === 'overview') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/deployable list | /deployable info <id> | /deployable buy <id> --confirm'
        );
        addTerminalSystemMessage('SYSTEM', '/deployable cancel');
        addTerminalSystemMessage(
          'SYSTEM',
          'Examples: /deployable info DataMine | /deployable buy DataMine --confirm'
        );
        return;
      }

      if (normalized === 'list') {
        addTerminalSystemMessage('SYSTEM', '/deployable list → shows all deployable IDs.');
        return;
      }

      if (normalized === 'info') {
        addTerminalSystemMessage('SYSTEM', '/deployable info <id> → shows cost + description.');
        addTerminalSystemMessage('SYSTEM', 'Example: /deployable info DataMine');
        return;
      }

      if (normalized === 'buy') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/deployable buy <id> --confirm → reserves a deployable for placement.'
        );
        addTerminalSystemMessage('SYSTEM', 'Example: /deployable buy DataMine --confirm');
        return;
      }

      if (normalized === 'cancel') {
        addTerminalSystemMessage(
          'SYSTEM',
          '/deployable cancel → cancels the current placement mode.'
        );
        return;
      }

      addTerminalSystemMessage(
        'WARNING',
        'Unknown deployable help topic. Try: /deployable help or /help deployable'
      );
    },
    [addTerminalSystemMessage]
  );

  const handleGameHelp = useCallback(() => {
    addTerminalSystemMessage('SYSTEM', '/game jack-in | /game start-wave | /game status');
    addTerminalSystemMessage(
      'SYSTEM',
      '/game shorten-path | /game lengthen-path | /game cancel-placement'
    );
    addTerminalSystemMessage(
      'SYSTEM',
      'Examples: /game jack-in | /game start-wave | /game shorten-path'
    );
    addTerminalSystemMessage(
      'SYSTEM',
      'Path controls cost bits and each command gets more expensive every use.'
    );
  }, [addTerminalSystemMessage]);

  const handleCodeHelp = useCallback(() => {
    const commands = allowStdStreams
      ? '/code test | /code submit | /code output | /code stdout | /code stderr'
      : '/code test | /code submit | /code output';
    addTerminalSystemMessage('SYSTEM', commands);
    addTerminalSystemMessage('SYSTEM', 'Examples: /code test | /code output');
    addTerminalSystemMessage(
      'SYSTEM',
      'Test/output commands cost bits and escalate per command used.'
    );
  }, [addTerminalSystemMessage, allowStdStreams]);

  return {
    handleHelpOverview,
    handleTowerHelp,
    handleDeployableHelp,
    handleGameHelp,
    handleCodeHelp,
  };
}
