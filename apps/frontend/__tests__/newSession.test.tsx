import { render, screen } from '@testing-library/react';
import React from 'react';
import NewSessionPage from '../app/new/page';

describe('NewSessionPage', () => {
  it('uses readable text styling for default input values', () => {
    render(React.createElement(NewSessionPage));

    for (const name of ['Name', 'Boards total', 'Rounds', 'Boards per round']) {
      expect(screen.getByLabelText(name)).toHaveClass('text-slate-950', 'placeholder:text-slate-500');
    }
  });
});
