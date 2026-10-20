import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CodeEditorSetupPanel from './CodeEditorSetupPanel';

const renderSetup = (props = {}) =>
  render(
    <ChakraProvider>
      <CodeEditorSetupPanel showTerminal={false} effectiveCodeGenerated={false} {...props} />
    </ChakraProvider>
  );

describe('CodeEditorSetupPanel locked workspace', () => {
  it('shows only the unlock directive with no setup guide', () => {
    renderSetup();

    expect(
      screen.getByText(/deploy a function tower in the game panel to unlock this workspace/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open setup guide/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/setup guide/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mission summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/system status/i)).not.toBeInTheDocument();
  });

  it('renders nothing once the workspace is unlocked', () => {
    renderSetup({ effectiveCodeGenerated: true });

    expect(screen.queryByTestId('code-editor-locked-setup')).not.toBeInTheDocument();
  });
});
