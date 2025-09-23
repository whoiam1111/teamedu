'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Student {
    id: number;
    name: string;
    region: string;
}

interface PendingByRegion {
    [region: string]: Student[];
}

export default function AdminPage() {
    const [date, setDate] = useState('');
    const [eventId, setEventId] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [pending, setPending] = useState<PendingByRegion>({});

    const checkAuth = async (): Promise<boolean> => {
        try {
            const res = await fetch('/api/admin/checkAuth', { credentials: 'include' });
            return res.ok;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        (async () => {
            const authenticated = await checkAuth();
            if (!authenticated) window.location.href = '/admin/login';
        })();
    }, []);

    const fetchPending = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/events/${id}/pending`, { credentials: 'include' });
            if (!res.ok) throw new Error('미출석 명단 불러오기 실패');

            const students: Student[] = await res.json();
            const grouped: PendingByRegion = {};
            students.forEach((s) => {
                if (!grouped[s.region]) grouped[s.region] = [];
                grouped[s.region].push(s);
            });
            setPending(grouped);
        } catch (err: any) {
            console.error(err.message);
        }
    };

    const createEvent = async () => {
        if (!date) return alert('날짜를 입력해주세요');
        try {
            const res = await fetch(`/api/admin/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('이벤트 생성 실패');

            const data = await res.json();
            setEventId(data.id);

            const studentUrl = `${window.location.origin}/checkin?event=${data.id}`;
            const qrDataUrl = await QRCode.toDataURL(studentUrl);
            setQrUrl(qrDataUrl);
            fetchPending(data.id);
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        if (!eventId) return;
        const interval = setInterval(() => fetchPending(eventId), 5000);
        return () => clearInterval(interval);
    }, [eventId]);

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-pink-300 via-orange-200 to-yellow-200 flex flex-col">
            {/* 상단 타이틀 + 날짜 입력 */}
            <header className="text-center py-6">
                <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-500 drop-shadow-lg">
                    출석 체크 이벤트
                </h1>
                <p className="text-2xl text-gray-700 mt-2">QR을 스캔해 출석을 완료하세요!</p>

                {/* 날짜 입력 + 이벤트 생성 */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-2 border-pink-400 rounded-xl px-4 py-2 text-2xl shadow-md focus:ring-4 focus:ring-pink-300"
                    />
                    <button
                        onClick={createEvent}
                        className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-2xl font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                    >
                        이벤트 생성
                    </button>
                </div>
            </header>

            {/* 본문: QR (왼쪽) | 명단 (오른쪽) */}
            <main className="flex flex-1 px-6 pb-6 gap-6">
                {/* QR 영역 */}
                <section className="w-1/2 flex flex-col items-center justify-center bg-white rounded-3xl shadow-2xl p-6">
                    {eventId && qrUrl ? (
                        <>
                            <h2 className="text-4xl font-bold text-orange-600 mb-6">QR 코드</h2>
                            <img
                                src={qrUrl}
                                alt="출석 QR 코드"
                                className="w-full h-full max-w-[650px] max-h-[650px] border-8 border-pink-500 rounded-3xl shadow-xl bg-white"
                            />
                            <p className="text-2xl text-gray-700 mt-6">📱 스캔하고 출석하세요</p>
                        </>
                    ) : (
                        <div className="text-3xl text-gray-500">이벤트를 생성해주세요</div>
                    )}
                </section>

                {/* 미출석 명단 */}
                <section className="w-1/2 flex flex-col bg-white/90 rounded-3xl shadow-xl p-6">
                    <h2 className="text-4xl font-bold text-pink-600 mb-6 text-center">📋 미출석 명단</h2>
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pr-2">
                        {Object.keys(pending).length === 0 ? (
                            <p className="text-3xl text-center text-green-600">모두 출석 완료 🎉</p>
                        ) : (
                            Object.entries(pending).map(([region, students]) => (
                                <div
                                    key={region}
                                    className="border-2 border-orange-300 rounded-2xl p-4 bg-orange-50/70"
                                >
                                    <h3 className="font-bold text-2xl text-orange-700 mb-3">{region}</h3>
                                    <ul className="grid grid-cols-1 gap-2 text-2xl">
                                        {students.map((s) => (
                                            <li
                                                key={s.id}
                                                className="py-2 px-3 bg-white rounded-xl shadow-sm text-gray-800"
                                            >
                                                {s.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
