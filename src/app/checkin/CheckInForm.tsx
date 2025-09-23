// src/app/checkin/CheckInForm.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckInForm() {
    const params = useSearchParams();
    const eventId = params.get('event') || '';
    const [name, setName] = useState('');
    const [status, setStatus] = useState('');
    const [submitted, setSubmitted] = useState(false);

    async function submit() {
        if (!eventId) return setStatus('❌ QR 코드가 잘못되었습니다.');
        if (!name) return setStatus('❌ 이름을 입력해주세요.');

        try {
            const res = await fetch('/api/checkins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, name }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('✅ 출석 완료!');
                setSubmitted(true);
            } else {
                setStatus(`❌ 출석 실패: ${data.error || '이름 확인 필요'}`);
            }
        } catch (err: any) {
            setStatus(`❌ 출석 실패: ${err.message}`);
        }
    }

    // 입력 후 자동 초기화 (3초 뒤)
    useEffect(() => {
        if (submitted) {
            const timeout = setTimeout(() => {
                setName('');
                setStatus('');
                setSubmitted(false);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [submitted]);

    return (
        <main className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <h1 className="text-3xl font-extrabold mb-8 text-blue-800">출석 체크</h1>

            <input
                type="text"
                placeholder="이름 입력"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-blue-400 p-4 rounded-xl w-full max-w-sm text-xl text-center mb-6 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300"
                disabled={submitted}
            />

            <button
                onClick={submit}
                className="w-full max-w-sm px-6 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
                disabled={submitted}
            >
                제출
            </button>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-8 text-2xl font-bold text-center ${
                            status.includes('✅') ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
                        {status}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
