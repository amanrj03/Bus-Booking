import React, { useState } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CitySearchInput from '../components/search/CitySearchInput';
import HeroSearchWidget from '../components/search/HeroSearchWidget';
import { INDIAN_CITIES_CATALOG, getUnifiedCities } from '../config/citiesConfig';

describe('CitySearchInput & Auto-Suggest Suite', () => {
  afterEach(() => {
    cleanup();
  });

  function Wrapper({ initialValue = '', onSelectNext }) {
    const [city, setCity] = useState(initialValue);
    return (
      <CitySearchInput
        id="test-city"
        label="From"
        value={city}
        onChange={setCity}
        placeholder="Origin city"
        allCities={INDIAN_CITIES_CATALOG}
        onSelectNext={onSelectNext}
      />
    );
  }

  it('renders input without native datalist element or indicator', () => {
    render(<Wrapper initialValue="Delhi" />);
    const input = screen.getByPlaceholderText('Origin city');
    expect(input).toBeTruthy();
    expect(input.getAttribute('list')).toBeNull();
  });

  it('opens suggestions popover when focused and displays popular destinations', () => {
    render(<Wrapper initialValue="" />);
    const input = screen.getByPlaceholderText('Origin city');

    // Popover initially hidden
    expect(screen.queryByText(/Popular Indian Destinations/i)).toBeNull();

    // Focus input
    fireEvent.focus(input);

    // Popover appears with destinations
    expect(screen.getByText(/Popular Indian Destinations/i)).toBeTruthy();
    expect(screen.getByText('Delhi')).toBeTruthy();
    expect(screen.getByText('Jaipur')).toBeTruthy();
    expect(screen.getByText('Mumbai')).toBeTruthy();
  });

  it('filters cities in real-time when typing "jaip" and selects Jaipur on click', () => {
    render(<Wrapper initialValue="" />);
    const input = screen.getByPlaceholderText('Origin city');

    fireEvent.change(input, { target: { value: 'jaip' } });

    // Should display matching header and Jaipur with state
    expect(screen.getByText(/Matching Cities/i)).toBeTruthy();
    expect(screen.getByText('Rajasthan')).toBeTruthy();

    // Click on the suggestion option containing Jaipur
    const optionBtn = screen.getByText('Rajasthan').closest('button');
    fireEvent.click(optionBtn);

    // Input should now have Jaipur and popover should close
    expect(input.value).toBe('Jaipur');
    expect(screen.queryByText(/Matching Cities/i)).toBeNull();
  });

  it('allows clearing the input via the clear button', () => {
    render(<Wrapper initialValue="Jaipur" />);
    const input = screen.getByPlaceholderText('Origin city');
    expect(input.value).toBe('Jaipur');

    const clearBtn = screen.getByRole('button', { name: /clear city/i });
    expect(clearBtn).toBeTruthy();

    fireEvent.click(clearBtn);
    expect(input.value).toBe('');
  });

  it('navigates suggestions via ArrowDown and selects with Enter', () => {
    render(<Wrapper initialValue="" />);
    const input = screen.getByPlaceholderText('Origin city');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'pune' } });

    // Press Enter to select the top filtered result (Pune)
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('Pune');
  });

  it('HeroSearchWidget swaps cities correctly and submits valid search payload', () => {
    let capturedSearch = null;
    render(
      <MemoryRouter>
        <HeroSearchWidget
          initialFrom="Delhi"
          initialTo="Jaipur"
          onSearch={(payload) => {
            capturedSearch = payload;
          }}
        />
      </MemoryRouter>
    );

    const fromInput = screen.getByDisplayValue('Delhi');
    const toInput = screen.getByDisplayValue('Jaipur');
    expect(fromInput).toBeTruthy();
    expect(toInput).toBeTruthy();

    // Click swap button
    const swapBtn = screen.getByRole('button', { name: /swap origin and destination/i });
    fireEvent.click(swapBtn);

    // Verify swapped
    expect(screen.getByDisplayValue('Jaipur')).toBeTruthy();
    expect(screen.getByDisplayValue('Delhi')).toBeTruthy();

    // Submit form
    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    expect(capturedSearch).toBeTruthy();
    expect(capturedSearch.sourceCity).toBe('Jaipur');
    expect(capturedSearch.destinationCity).toBe('Delhi');
  });
});
