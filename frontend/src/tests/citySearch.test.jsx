import React, { useState } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CitySearchInput from '../components/search/CitySearchInput';
import HeroSearchWidget from '../components/search/HeroSearchWidget';
import { INDIAN_CITIES_CATALOG } from '../config/citiesConfig';

describe('CitySearchInput & Auto-Suggest Suite', () => {
  afterEach(() => {
    cleanup();
  });

  function Wrapper({ initialValue = '', onSelectNext }) {
    const [city, setCity] = useState(initialValue);
    const [confirmed, setConfirmed] = useState(Boolean(initialValue));
    return (
      <CitySearchInput
        id="test-city"
        label="From"
        value={city}
        isConfirmed={confirmed}
        onChange={(val, isConf) => {
          setCity(val);
          setConfirmed(isConf);
        }}
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

  it('filters cities in real-time when typing "patna" and displays Patna with Bihar', () => {
    render(<Wrapper initialValue="" />);
    const input = screen.getByPlaceholderText('Origin city');

    fireEvent.change(input, { target: { value: 'patna' } });

    // Should display Patna with Bihar state tag
    expect(screen.getByText(/Matching Cities/i)).toBeTruthy();
    expect(screen.getByText('Bihar')).toBeTruthy();

    // Click on the suggestion option containing Patna
    const optionBtn = screen.getByText('Bihar').closest('button');
    fireEvent.click(optionBtn);

    // Input should now have Patna and popover should close
    expect(input.value).toBe('Patna');
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

  it('blocks search if city was typed without selecting from dropdown', () => {
    render(
      <MemoryRouter>
        <HeroSearchWidget initialFrom="Delhi" initialTo="Jaipur" />
      </MemoryRouter>
    );

    const fromInput = screen.getByDisplayValue('Delhi');
    // Type an incomplete query without selecting from dropdown
    fireEvent.change(fromInput, { target: { value: 'randomcityxyz' } });

    // Click outside to close popover
    fireEvent.mouseDown(document.body);

    // Click search
    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    // Validation alert must appear
    expect(
      screen.getByText(/Please select the origin city from the suggestion list/i)
    ).toBeTruthy();
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

  it('opens interactive calendar on calendar icon click and allows picking year, month, and date', () => {
    let chosenDate = '2026-11-15';
    render(
      <MemoryRouter>
        <HeroSearchWidget
          initialFrom="Delhi"
          initialTo="Jaipur"
          initialDate={chosenDate}
          onSearch={() => {}}
        />
      </MemoryRouter>
    );

    // Click calendar button
    const calBtn = screen.getByRole('button', { name: /open departure calendar/i });
    expect(calBtn).toBeTruthy();

    // Calendar popover should not be visible initially
    expect(screen.queryByText('Today')).toBeNull();

    fireEvent.click(calBtn);

    // Calendar popover opens
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Tomorrow')).toBeTruthy();
    expect(screen.getByText('November')).toBeTruthy();

    // Click day 27
    const day27Btn = screen.getByRole('button', { name: '27' });
    expect(day27Btn).toBeTruthy();
    fireEvent.click(day27Btn);

    // Popover should close and date should be Fri, 27 Nov
    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.getByText(/27 Nov/i)).toBeTruthy();
  });
});
