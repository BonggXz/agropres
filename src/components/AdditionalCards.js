import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { db } from '../firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Plus, Trash2, History, Send, CheckCircle } from 'lucide-react';

/* WA Function (No Change) */
const sendToTextMeBot = async (number, message) => {
  const apiKey = "K1xkdYW6uvab"; 
  if (!number) return false;
  let formattedNum = number.toString().trim();
  formattedNum = formattedNum.replace(/\D/g,'');
  if (formattedNum.startsWith('0')) formattedNum = '62' + formattedNum.slice(1);
  if (!formattedNum.startsWith('+')) formattedNum = '+' + formattedNum;
  const encodedMsg = encodeURIComponent(message);
  const url = `https://api.textmebot.com/send.php?recipient=${formattedNum}&apikey=${apiKey}&text=${encodedMsg}`;
  try {
    await fetch(url, { mode: 'no-cors' });
    return true;
  } catch (error) { return false; }
};

export const WhatsAppSchedulerCard = ({ user, userData, customToast }) => {
  const [schedules, setSchedules] = useState({});
  const [loadingSend, setLoadingSend] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ date: '', time: '', note: '', targetNumber: '', message: '', });

  useEffect(() => { if (userData?.whatsapp_number) setNewSchedule((p) => ({ ...p, targetNumber: userData.whatsapp_number })); }, [userData]);
  useEffect(() => { if (!user?.uid) return; const unsub = onValue(ref(db, `users/${user.uid}/pestisida_schedules`), (snap) => setSchedules(snap.val() || {})); return () => unsub(); }, [user?.uid]);

  // LOGIKA OTOMATIS & NOTIFIKASI BARU
  useEffect(() => {
    const checkSchedules = async () => {
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentDate = now.toISOString().split('T')[0];
        
        Object.entries(schedules).forEach(async ([key, item]) => {
            if (item.status === 'active') {
                const itemDate = new Date(item.datetime);
                const schedDate = item.datetime.split('T')[0];
                const schedHour = itemDate.getHours().toString().padStart(2, '0');
                const schedMinute = itemDate.getMinutes().toString().padStart(2, '0');

                if (schedDate === currentDate && schedHour === currentHour && schedMinute === currentMinute) {
                    await update(ref(db, `users/${user.uid}/pestisida_schedules/${key}`), { status: 'sending' });
                    const success = await sendToTextMeBot(item.targetNumber, item.message);
                    if (success) {
                        // Notifikasi Keren Saat Terkirim Otomatis
                        if(customToast) customToast(`Jadwal "${item.note}" berhasil dieksekusi!`, 'success');
                        await update(ref(db, `users/${user.uid}/pestisida_schedules/${key}`), { status: 'completed' });
                    } else {
                        await update(ref(db, `users/${user.uid}/pestisida_schedules/${key}`), { status: 'failed' });
                    }
                }
            }
        });
    };
    const interval = setInterval(checkSchedules, 30000);
    return () => clearInterval(interval);
  }, [schedules, user, customToast]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSchedule.date || !newSchedule.time) { 
        if(customToast) customToast('Data tanggal/waktu belum lengkap', 'error'); 
        return; 
    }
    const scheduleTime = new Date(`${newSchedule.date}T${newSchedule.time}`);
    try {
      await push(ref(db, `users/${user.uid}/pestisida_schedules`), { datetime: scheduleTime.toISOString(), note: newSchedule.note, targetNumber: newSchedule.targetNumber || userData?.whatsapp_number, message: newSchedule.message || `PENGINGAT AGROPRES: Saatnya ${newSchedule.note}`, status: 'active', });
      setNewSchedule((prev) => ({ ...prev, date: '', time: '', note: '', }));
      if(customToast) customToast('Pengingat berhasil dibuat!', 'success');
    } catch { 
      if(customToast) customToast('Gagal membuat pengingat', 'error'); 
    }
  };

  const handleTestSend = async () => {
    if (!newSchedule.targetNumber) { if(customToast) customToast("Nomor WA kosong", 'error'); return; }
    setLoadingSend(true);
    const msg = `TEST AGROPRES: Sistem Notifikasi Berjalan Normal.`;
    const success = await sendToTextMeBot(newSchedule.targetNumber, msg);
    if (success && customToast) customToast("Pesan WA Terkirim!", 'success');
    else if(customToast) customToast("Gagal kirim pesan", 'error');
    setLoadingSend(false);
  };

  const handleDelete = async (id) => { 
      try { 
          await remove(ref(db, `users/${user.uid}/pestisida_schedules/${id}`)); 
          if(customToast) customToast('Jadwal dihapus', 'success'); 
      } catch { 
          if(customToast) customToast('Gagal hapus', 'error'); 
      }
  };

  return (
    <Card className="shadow-sm border-slate-200 mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <CardTitle className="text-lg">Jadwal & Notifikasi WA</CardTitle>
        </div>
        <CardDescription><span className="text-red-500 font-bold">*Web harus terbuka agar jadwal jalan</span></CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"> <Label className="text-xs">Tanggal</Label> <Input type="date" value={newSchedule.date} onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })} required className="h-9" /> </div>
            <div className="space-y-1"> <Label className="text-xs">Waktu</Label> <Input type="time" value={newSchedule.time} onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })} required className="h-9" /> </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nomor WhatsApp</Label>
            <div className="flex gap-2">
                <Input type="text" placeholder="08..." value={newSchedule.targetNumber} onChange={(e) => setNewSchedule({ ...newSchedule, targetNumber: e.target.value })} className="h-9" />
                <Button type="button" variant="outline" size="icon" onClick={handleTestSend} disabled={loadingSend} title="Test Pesan"><Send className="w-4 h-4 text-blue-600" /></Button>
            </div>
          </div>
          <div className="space-y-1"> <Label className="text-xs">Catatan</Label> <Input type="text" placeholder="cth: Siram" value={newSchedule.note} onChange={(e) => setNewSchedule({ ...newSchedule, note: e.target.value })} required className="h-9" /> </div>
          <Button type="submit" className="w-full gap-2 h-9 bg-green-600 hover:bg-green-700"> <Plus className="w-4 h-4" /> Simpan Jadwal </Button>
        </form>
        
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-xs font-semibold mb-3 text-slate-500">Antrian Jadwal</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {Object.keys(schedules).length > 0 ? ( Object.entries(schedules).map(([id, item]) => (
                <div key={id} className={`flex items-start justify-between p-3 rounded-lg border ${item.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{item.note}</p>
                        {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-600"/>}
                        {item.status === 'active' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Menunggu</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.datetime).toLocaleDateString('id-ID')} • {new Date(item.datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(id)} className="h-6 w-6 text-red-400 hover:text-red-600"> <Trash2 className="w-3 h-3" /> </Button>
                </div>
              )) ) : ( <div className="text-center py-4 text-xs text-slate-400">Kosong</div> )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* LOGS CARD (FIX: BATASI 5 LOGS) */
export const LogsCard = ({ logs }) => {
  // 1. Sort terbaru di atas (descending timestamp)
  // 2. Ambil 5 teratas saja (.slice(0, 5))
  const sortedLogs = logs 
    ? Object.values(logs)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5) 
    : [];
  
  return (
    <Card className="h-full shadow-sm border-slate-200 flex flex-col">
      <CardHeader className="pb-2"> <div className="flex items-center gap-2"> <History className="w-5 h-5 text-indigo-600" /> <CardTitle className="text-lg">Log Aktivitas</CardTitle> </div> </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sortedLogs.length > 0 ? ( sortedLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ log.type === 'alert' ? 'bg-red-500' : 'bg-blue-500' }`} />
                <div className="flex-1 min-w-0"> 
                    <p className="font-medium text-slate-800 break-words leading-snug"> {log.message} </p> 
                    <p className="text-[10px] text-slate-400 mt-1"> {new Date(log.timestamp).toLocaleString('id-ID')} </p> 
                </div>
              </div>
            )) ) : ( <div className="text-center py-10 text-xs text-slate-400"> Belum ada log </div> )}
        </div>
      </CardContent>
    </Card>
  );
};