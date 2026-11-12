/**
 * Filters seats by deck number, sorts columns, and splits each row into left/right aisle sides.
 * For 2x1 AC Sleepers: column 1 is left side, columns 2-3 are right side.
 * For 2x2 Seaters: columns 1-2 are left side, columns 3-4 are right side.
 */
export function groupDeckRows(seats = [], deckNumber = 1, isSleeperCoach = false) {
  const deckSeats = seats.filter((s) => (s.deck || 1) === deckNumber);
  const map = new Map();

  deckSeats.forEach((seat) => {
    if (!map.has(seat.row)) {
      map.set(seat.row, []);
    }
    map.get(seat.row).push(seat);
  });

  return Array.from(map.entries())
    .sort(([rowA], [rowB]) => rowA - rowB)
    .map(([rowNum, rowSeats]) => {
      const sorted = [...rowSeats].sort((a, b) => a.column - b.column);
      const splitCol = isSleeperCoach ? 1 : 2;
      return {
        rowNum,
        seats: sorted,
        leftSeats: sorted.filter((s) => s.column <= splitCol),
        rightSeats: sorted.filter((s) => s.column > splitCol),
      };
    });
}

/**
 * Computes total INR subtotal for currently selected seat numbers.
 */
export function calculateSelectedSubtotal(seats = [], selectedNumbers = []) {
  return seats
    .filter((s) => selectedNumbers.includes(s.seatNumber))
    .reduce((sum, s) => sum + Number(s.price || 0), 0);
}

/**
 * Summarizes live seat counts by availability status.
 */
export function computeAvailabilitySummary(seats = []) {
  return seats.reduce(
    (acc, s) => {
      acc.total += 1;
      if (s.status === 'AVAILABLE') acc.available += 1;
      else if (s.status === 'LOCKED') acc.locked += 1;
      else if (s.status === 'BOOKED') acc.booked += 1;
      return acc;
    },
    { total: 0, available: 0, locked: 0, booked: 0 }
  );
}
