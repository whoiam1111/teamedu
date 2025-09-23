'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckInPage() {
    const [eventId, setEventId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [status, setStatus] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // 클라이언트에서만 실행
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const id = searchParams.get('event');
        setEventId(id);
    }, []);

    async function submit() {
        if (!eventId) {
            setStatus('❌ QR 코드가 잘못되었습니다.');
            return;
        }
        if (!name) {
            setStatus('❌ 이름을 입력해주세요.');
            return;
        }

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
            } else setStatus(`❌ 출석 실패: ${data.error || '이름 확인 필요'}`);
        } catch (err: any) {
            setStatus(`❌ 출석 실패: ${err.message}`);
        }
    }

    // 제출 후 3초 뒤 초기화
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
        <main className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-6">
            <h1 className="text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-500 drop-shadow-lg animate-pulse">
                🌟 출석 체크 🌟
            </h1>

            <input
                type="text"
                placeholder="이름 입력"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitted}
                className="border-4 border-pink-300 rounded-2xl px-6 py-4 w-full max-w-md text-2xl text-center shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-200 placeholder-pink-400 mb-6 transition transform hover:scale-105"
            />

            <button
                onClick={submit}
                disabled={submitted}
                className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 text-white text-2xl font-bold rounded-2xl shadow-xl hover:scale-105 hover:brightness-110 active:scale-95 transition"
            >
                제출!
            </button>

            <AnimatePresence>
                {status && (
                    <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-6 text-3xl font-bold text-center ${
                            status.includes('✅') ? 'text-green-500' : 'text-red-500'
                        }`}
                    >
                        {status}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
