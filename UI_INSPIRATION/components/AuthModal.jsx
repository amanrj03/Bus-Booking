import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const [isRegister, setIsRegister] = useState(true);
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            {/* Background Image Container */}
            <div
                className="relative bg-white rounded-2xl overflow-hidden max-w-4xl w-full flex shadow-2xl min-h-[500px] bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80')` }}
            >
                <div className="absolute inset-0 bg-black/30" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-white/80 p-1.5 rounded-full hover:bg-white text-gray-800"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Card Overlay Right */}
                <div className="relative z-10 ml-auto w-full max-w-md bg-white p-8 flex flex-col justify-between">
                    <div>
                        {/* Header Brand */}
                        <div className="flex justify-center mb-4">
                            <span className="bg-[#73d200] text-gray-900 font-black px-4 py-1 rounded text-xl tracking-tighter">
                                FLIX
                            </span>
                        </div>

                        <h2 className="text-xl font-black text-center text-gray-900 mb-4">
                            {isRegister ? 'Register' : 'Sign in'}
                        </h2>

                        {/* Benefits Checklist */}
                        <ul className="space-y-2 mb-6 text-xs text-gray-600 font-medium">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#73d200] shrink-0" />
                                <span>Full control over your bookings anytime</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#73d200] shrink-0" />
                                <span>Get travel updates</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#73d200] shrink-0" />
                                <span>Track your trip in real-time</span>
                            </li>
                        </ul>

                        {/* Email Form Field */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#73d200]"
                                />
                            </div>

                            <button className="w-full bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold py-3 rounded-lg text-sm shadow">
                                Continue
                            </button>
                        </div>
                    </div>

                    {/* Footer Switch Mode */}
                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        </p>
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs font-bold text-gray-900 hover:underline"
                        >
                            {isRegister ? '👤 Sign in here' : '👤 Register here'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}