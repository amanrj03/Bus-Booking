import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  TruckIcon,
} from '@heroicons/react/24/solid';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Button, Card, Alert, Modal } from '../components/ui';
import HeroSearchWidget from '../components/search/HeroSearchWidget';
import SearchFilterSidebar from '../components/search/SearchFilterSidebar';
import TripResultCard from '../components/search/TripResultCard';
import SeatMapDrawer from '../components/seats/SeatMapDrawer';
import { searchTrips } from '../services/trip.service';
import { formatDateTabLabel, getLocalDateString } from '../utils/dateUtils';

const DEFAULT_FILTERS = {
  busType: '',
  departureWindow: '',
  maxPrice: 3000,
  sortBy: 'departure_asc',
};

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const todayStr = getLocalDateString(0);
  const sourceCity = searchParams.get('sourceCity') || 'Delhi';
  const destinationCity = searchParams.get('destinationCity') || 'Jaipur';
  const date = searchParams.get('date') || todayStr;
  const passengers = Number(searchParams.get('passengers') || 1);
  const page = Number(searchParams.get('page') || 1);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModifySearch, setShowModifySearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        sourceCity,
        destinationCity,
        date,
        sortBy: filters.sortBy,
        page,
        limit: 10,
      };
      if (filters.busType) params.busType = filters.busType;
      if (filters.departureWindow) params.departureWindow = filters.departureWindow;
      if (filters.maxPrice && filters.maxPrice < 3000) params.maxPrice = filters.maxPrice;

      const data = await searchTrips(params);
      setTrips(data.trips || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Unable to load available trips right now.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [sourceCity, destinationCity, date, page, filters]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleUpdateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const next = new URLSearchParams(searchParams);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    const next = new URLSearchParams(searchParams);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleDateChange = (nextDate) => {
    if (nextDate < todayStr) return;
    const next = new URLSearchParams(searchParams);
    next.set('date', nextDate);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSwapRoute = () => {
    const next = new URLSearchParams(searchParams);
    next.set('sourceCity', destinationCity);
    next.set('destinationCity', sourceCity);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevDay = getLocalDateString(-1, date);
  const nextDay = getLocalDateString(1, date);
  const dateTabs = [
    { date: prevDay, label: formatDateTabLabel(prevDay), disabled: prevDay < todayStr },
    { date, label: formatDateTabLabel(date), disabled: false, active: true },
    { date: nextDay, label: formatDateTabLabel(nextDay), disabled: false },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Dark Summary Header */}
      <section className="bg-[#131b26] text-white border-b border-gray-800 px-4 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-[#73d200]" />
                  {sourceCity}
                </span>
                <button
                  type="button"
                  onClick={handleSwapRoute}
                  title="Swap cities"
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-[#73d200] transition-colors cursor-pointer"
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" />
                </button>
                <span className="text-xl sm:text-2xl font-black">{destinationCity}</span>
              </div>
              <p className="text-xs text-gray-300 flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-[#73d200]" />
                  {formatDateTabLabel(date)}
                </span>
                <span>•</span>
                <span>
                  {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={AdjustmentsHorizontalIcon}
                className="lg:hidden bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => setShowMobileFilters(true)}
              >
                Filters
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowModifySearch((prev) => !prev)}
              >
                {showModifySearch ? 'Close Search' : 'Modify Search'}
              </Button>
            </div>
          </div>

          {showModifySearch && (
            <div className="mt-5">
              <HeroSearchWidget
                initialFrom={sourceCity}
                initialTo={destinationCity}
                initialDate={date}
                initialPassengers={passengers}
                onSearch={(payload) => {
                  setShowModifySearch(false);
                  const next = new URLSearchParams({
                    sourceCity: payload.sourceCity,
                    destinationCity: payload.destinationCity,
                    date: payload.date,
                    passengers: String(payload.passengers),
                    page: '1',
                  });
                  setSearchParams(next);
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Date Switcher Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {dateTabs.map((tab) => (
              <button
                key={tab.date}
                type="button"
                disabled={tab.disabled}
                onClick={() => handleDateChange(tab.date)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  tab.active
                    ? 'bg-[#73d200] text-gray-900 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-500 hidden sm:block">
            {loading ? 'Searching trips...' : `${pagination.total || trips.length} buses found`}
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar + Results */}
      <section className="max-w-6xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20">
            <SearchFilterSidebar
              filters={filters}
              onUpdateFilter={handleUpdateFilter}
              onResetFilters={handleResetFilters}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-4">
          {error && (
            <Alert variant="danger" title="Search Failed">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={loadTrips}>
                  Retry
                </Button>
              </div>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse space-y-3">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-8 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                </Card>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <Card className="text-center py-12 px-4">
              <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-gray-900 mb-1">
                No scheduled buses matched your criteria
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
                Try adjusting your price slider, removing departure window filters, or switching to another travel date.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="primary" size="sm" onClick={handleResetFilters}>
                  Reset All Filters
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3.5">
                {trips.map((trip) => (
                  <TripResultCard
                    key={trip.id}
                    trip={trip}
                    passengersRequested={passengers}
                    onSelectSeats={(t) => setSelectedTrip(t)}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    icon={ChevronLeftIcon}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    icon={ChevronRightIcon}
                    iconPosition="right"
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Mobile Filters Modal */}
      <Modal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filter & Sort Trips"
        size="sm"
      >
        <SearchFilterSidebar
          filters={filters}
          onUpdateFilter={handleUpdateFilter}
          onResetFilters={() => {
            handleResetFilters();
            setShowMobileFilters(false);
          }}
        />
      </Modal>

      {/* Interactive Bus Seat Map Drawer */}
      <SeatMapDrawer
        trip={selectedTrip}
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        passengersRequested={passengers}
      />
    </div>
  );
}
