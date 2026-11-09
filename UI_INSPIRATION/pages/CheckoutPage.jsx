import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Plus, Minus, Info, Timer } from 'lucide-react';
import SeatMapModal from '../components/SeatMapModal';

export default function CheckoutPage({ selectedTrip, onBack }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+49');

    const [addBaggageCount, setAddBaggageCount] = useState(0);
    const [specialBaggageCount, setSpecialBaggageCount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('klarna');

    const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState(null);

    const basePrice = parseFloat(selectedTrip?.price || 46.98);
    const serviceFee = 3.99;
    const seatFee = selectedSeat ? 6.39 : 0;
    const extraLuggageFee = addBaggageCount * 22.99;
    const specialLuggageFee = specialBaggageCount * 33.99;

    const totalPrice = (basePrice + serviceFee + seatFee + extraLuggageFee + specialLuggageFee).toFixed(2);

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-4 hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Main Steps */}
                    <div className="lg:col-span-8 space-y-4">

                        {/* Step 1: Passengers */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 rounded bg-[#73d200] text-gray-900 font-bold text-xs flex items-center justify-center">1</span>
                                <h2 className="font-bold text-gray-900 text-base">Passengers</h2>
                            </div>
                            <p className="text-[11px] text-gray-400 mb-3">* Required information</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">First name *</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#73d200]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Last name *</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#73d200]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Seat Reservation */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 rounded bg-[#73d200] text-gray-900 font-bold text-xs flex items-center justify-center">2</span>
                                <h2 className="font-bold text-gray-900 text-base">Seat Reservation</h2>
                            </div>

                            <div className="space-y-3">
                                <div
                                    onClick={() => setIsSeatModalOpen(true)}
                                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-gray-400 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">💺</div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900">
                                                {selectedSeat ? `Seat Selected: ${selectedSeat}` : 'Select your seat'}
                                            </h4>
                                            <p className="text-[11px] text-gray-500">from 6.39 US$</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-gray-400 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">🛋️</div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900">Travel neighbour-free</h4>
                                            <p className="text-[11px] text-gray-500">from 32.38 US$</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Extras */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-6 h-6 rounded bg-[#73d200] text-gray-900 font-bold text-xs flex items-center justify-center">3</span>
                                <h2 className="font-bold text-gray-900 text-base">Extras</h2>
                            </div>

                            {/* Included Luggage Card */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                                <div className="p-2 bg-gray-200 rounded text-gray-700">🎒</div>
                                <div className="text-xs">
                                    <h4 className="font-bold text-gray-900">Included per person</h4>
                                    <p className="text-gray-500">1 Small soft bag or backpack | 7 kg · 42×30×18 cm</p>
                                    <p className="text-gray-500">1 Hold Luggage | 20 kg · 80×50×30 cm</p>
                                </div>
                            </div>

                            {/* Additional Luggage Counter */}
                            <div className="flex items-center justify-between py-2 border-t text-xs">
                                <div>
                                    <h4 className="font-bold text-gray-900">Additional luggage</h4>
                                    <p className="text-gray-500">20 kg · 80×50×30 cm</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-600">+ 22.99 US$</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setAddBaggageCount(Math.max(0, addBaggageCount - 1))}
                                            className="p-1.5 hover:bg-gray-100 text-gray-600"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-3 font-bold text-sm">{addBaggageCount}</span>
                                        <button
                                            onClick={() => setAddBaggageCount(addBaggageCount + 1)}
                                            className="p-1.5 hover:bg-gray-100 text-gray-600"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Special Luggage Counter */}
                            <div className="flex items-center justify-between py-2 border-t text-xs">
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center gap-1">
                                        Special luggage <Info className="w-3 h-3 text-gray-400" />
                                    </h4>
                                    <p className="text-gray-500">30 kg · 240 cm (x + y + z)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-600">+ 33.99 US$</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setSpecialBaggageCount(Math.max(0, specialBaggageCount - 1))}
                                            className="p-1.5 hover:bg-gray-100 text-gray-600"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-3 font-bold text-sm">{specialBaggageCount}</span>
                                        <button
                                            onClick={() => setSpecialBaggageCount(specialBaggageCount + 1)}
                                            className="p-1.5 hover:bg-gray-100 text-gray-600"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Contact */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 rounded bg-[#73d200] text-gray-900 font-bold text-xs flex items-center justify-center">4</span>
                                <h2 className="font-bold text-gray-900 text-base">Contact</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#73d200]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Phone number</label>
                                    <div className="flex">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 px-2 text-xs font-bold"
                                        >
                                            <option value="+49">🇩🇪 +49</option>
                                            <option value="+1">🇺🇸 +1</option>
                                        </select>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full border border-gray-300 rounded-r-lg p-2.5 text-sm focus:outline-none focus:border-[#73d200]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 5: Payment */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-6 h-6 rounded bg-[#73d200] text-gray-900 font-bold text-xs flex items-center justify-center">5</span>
                                <h2 className="font-bold text-gray-900 text-base">Payment</h2>
                            </div>
                            <p className="text-xs text-gray-500">Please choose a payment method</p>

                            {/* Option: Klarna */}
                            <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'klarna'}
                                    onChange={() => setPaymentMethod('klarna')}
                                    className="accent-[#73d200]"
                                />
                                <span className="font-bold text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">Klarna</span>
                            </label>

                            {/* Option: Google Pay */}
                            <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'gpay'}
                                    onChange={() => setPaymentMethod('gpay')}
                                    className="accent-[#73d200]"
                                />
                                <span className="font-bold text-xs text-gray-800">Google Pay</span>
                            </label>

                            {/* Option: Cards */}
                            <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'card'}
                                    onChange={() => setPaymentMethod('card')}
                                    className="accent-[#73d200]"
                                />
                                <span className="font-bold text-xs text-gray-800">Cards (Visa, Mastercard, Amex)</span>
                            </label>

                            {/* Option: PayPal */}
                            <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'paypal'}
                                    onChange={() => setPaymentMethod('paypal')}
                                    className="accent-[#73d200]"
                                />
                                <span className="font-bold text-xs text-blue-700">PayPal</span>
                            </label>
                        </div>
                    </div>

                    {/* Right Sticky Sidebar / Booking Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md sticky top-20 space-y-4">
                            <div className="flex items-center justify-between border-b pb-3">
                                <h3 className="font-extrabold text-gray-900 text-base">Your Booking</h3>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                                    <Timer className="w-3.5 h-3.5 text-[#73d200]" />
                                    <span>09:12</span>
                                </div>
                            </div>

                            {/* Trip Brief */}
                            <div className="text-xs space-y-2 border-b pb-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Mon, 9 Nov</span>
                                    <span className="bg-[#73d200]/20 text-gray-900 font-bold px-2 py-0.5 rounded text-[10px]">FlixBus</span>
                                </div>
                                <p className="text-gray-600">New York Midtown ➔ Boston (South Station)</p>
                                <span className="text-[10px] text-green-700 font-bold">DIRECT TRIP</span>
                            </div>

                            {/* Cost Summary Breakdown */}
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-gray-600">
                                    <span>1 Adult</span>
                                    <span>${basePrice.toFixed(2)}</span>
                                </div>
                                {selectedSeat && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Seat Reservation</span>
                                        <span>${seatFee.toFixed(2)}</span>
                                    </div>
                                )}
                                {addBaggageCount > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Extra Luggage ({addBaggageCount})</span>
                                        <span>${extraLuggageFee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span className="flex items-center gap-1">Service Fee <Info className="w-3 h-3 text-gray-400" /></span>
                                    <span>${serviceFee.toFixed(2)}</span>
                                </div>

                                <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="font-extrabold text-gray-900 text-sm">Total (incl. VAT)</span>
                                    <span className="font-black text-xl text-gray-900">${totalPrice} US$</span>
                                </div>
                            </div>

                            {/* Pay Action Button */}
                            <button className="w-full bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-black py-3.5 rounded-lg text-sm shadow-md transition-all active:scale-[0.99]">
                                Pay now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seat Map Modal Overlay Component */}
            <SeatMapModal
                isOpen={isSeatModalOpen}
                onClose={() => setIsSeatModalOpen(false)}
                selectedSeat={selectedSeat}
                setSelectedSeat={setSelectedSeat}
            />
        </div>
    );
}