import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { ref, onValue, set, get, push, remove, update } from "firebase/database";
import { auth, db } from '../firebase/config';
import { FaLightbulb, FaVolumeUp, FaTrash, FaPlus, FaSave, FaEdit, FaTimes, FaClock, FaWifi, FaUser, FaBell } from 'react-icons/fa';
import { BsSoundwave, BsWifi, BsWifiOff, BsCalendar3, BsGearFill } from 'react-icons/bs';
import { IoMdLogOut } from "react-icons/io";
import { HiOutlineDevicePhoneMobile, HiSparkles } from 'react-icons/hi2';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

// --- UI Helpers ---
const CustomSwitch = memo(({ isChecked, onChange, disabled = false, colorScheme = 'blue' }) => {
  const bgColor = isChecked 
    ? colorScheme === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'
    : 'bg-gradient-to-r from-gray-200 to-gray-300';
  return (
    <div 
      onClick={!disabled ? onChange : undefined} 
      className={`flex items-center h-8 w-14 rounded-full transition-colors duration-300 relative ${disabled?'cursor-not-allowed opacity-50':'cursor-pointer'} ${bgColor} p-1 ${isChecked ? 'justify-end' : 'justify-start'}`}
    >
      <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 35 }} className="h-6 w-6 bg-white rounded-full shadow-md" />
      <AnimatePresence>
        {isChecked && (
          <motion.div className="absolute right-2 top-1/2 -translate-y-1/2" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
            <HiSparkles className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const ModeControl = memo(({ mode, onModeChange }) => {
  const base = "px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 transform";
  const act = "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25";
  const inact = "bg-white text-gray-600 hover:bg-gray-50 shadow-md border border-gray-200";
  return (
    <div className="flex items-center p-1.5 space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-inner">
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onModeChange('manual')} className={`${base} ${mode==='manual'?act:inact}`}>Manual</motion.button>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onModeChange('auto')} className={`${base} ${mode==='auto'?act:inact}`}>Otomatis</motion.button>
    </div>
  );
});

// --- Cards ---
const DashboardHeader = memo(({ user }) => {
  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'Konfirmasi Logout', text: 'Apakah Anda yakin ingin keluar?', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Ya, Logout', cancelButtonText: 'Batal',
      customClass: { popup:'rounded-2xl shadow-xl', confirmButton:'px-6 py-2.5 text-white bg-red-600 rounded-lg font-semibold hover:bg-red-700', cancelButton:'px-6 py-2.5 text-white bg-gray-500 rounded-lg font-semibold hover:bg-gray-600', actions:'gap-4' }, buttonsStyling: false
    });
    if (res.isConfirmed) {
      try { await signOut(auth); Swal.fire({ title:'Berhasil Logout!', icon:'success', timer:1500, showConfirmButton:false, customClass:{popup:'rounded-2xl'} }); }
      catch { Swal.fire({ title:'Error!', text:'Gagal logout. Coba lagi.', icon:'error', customClass:{popup:'rounded-2xl'} }); }
    }
  };
  return (
    <motion.header custom={0} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 mb-8">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-20 translate-x-20 opacity-50"></div>
      <div className="relative flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 gap-4">
        <div className="flex items-center space-x-4">
          <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring' }} className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
            <FaWifi className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Dashboard Agro Pres</h1>
            <p className="text-gray-600 mt-2 flex items-center text-sm"><FaUser className="w-4 h-4 mr-2" />Selamat datang, {user?.email}</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="inline-flex items-center px-6 py-3 text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-500/20">
          <IoMdLogOut className="w-5 h-5 mr-2" /> Logout
        </motion.button>
      </div>
    </motion.header>
  );
});

const StatusCard = memo(({ isOnline }) => (
  <motion.div custom={1} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
    <div className="relative p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Status Perangkat</h2>
        <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
          <HiOutlineDevicePhoneMobile className={`w-6 h-6 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className={`flex items-center justify-between p-6 rounded-2xl ${isOnline ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'}`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}>
            {isOnline ? <BsWifi className="w-6 h-6 text-white" /> : <BsWifiOff className="w-6 h-6 text-white" />}
          </div>
          <div>
            <span className={`text-2xl font-bold ${isOnline ? 'text-green-700' : 'text-red-700'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'} mt-1`}>{isOnline ? 'Perangkat terhubung' : 'Perangkat tidak terhubung'}</p>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
      </div>
    </div>
  </motion.div>
));

const ControlCard = memo(({ deviceData, uvMode, ultrasonicMode, handleModeChange, handleManualToggle }) => (
  <motion.div custom={2} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
    <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full -translate-y-12 -translate-x-12 opacity-50"></div>
    <div className="relative p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Kontrol Perangkat</h2>
        <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100"><BsGearFill className="w-6 h-6 text-blue-600" /></div>
      </div>
      <div className="space-y-8">
        {/* UV */}
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg"><FaLightbulb className="w-6 h-6 text-white" /></div>
              <div><h3 className="text-xl font-bold text-gray-800">Lampu UV</h3><p className="text-sm text-gray-600">Pengendali hama ultraviolet</p></div>
            </div>
            <ModeControl mode={uvMode} onModeChange={(m)=>handleModeChange('uv_light', m)} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm font-semibold ${uvMode==='manual'?'text-gray-700':'text-gray-400'}`}>Kontrol Manual</span>
            <CustomSwitch isChecked={!!deviceData?.controls?.uv_light} onChange={()=>handleManualToggle('uv_light', !deviceData?.controls?.uv_light)} disabled={uvMode!=='manual'} colorScheme="yellow" />
          </div>
        </div>
        {/* Ultrasonic */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg"><BsSoundwave className="w-6 h-6 text-white" /></div>
              <div><h3 className="text-xl font-bold text-gray-800">Suara Ultrasonik</h3><p className="text-sm text-gray-600">Pengusir hama gelombang suara</p></div>
            </div>
            <ModeControl mode={ultrasonicMode} onModeChange={(m)=>handleModeChange('ultrasonic', m)} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm font-semibold ${ultrasonicMode==='manual'?'text-gray-700':'text-gray-400'}`}>Kontrol Manual</span>
            <CustomSwitch isChecked={!!deviceData?.controls?.ultrasonic} onChange={()=>handleManualToggle('ultrasonic', !deviceData?.controls?.ultrasonic)} disabled={ultrasonicMode!=='manual'} colorScheme="blue" />
          </div>
        </div>
      </div>
    </div>
  </motion.div>
));

const ScheduleCard = memo(({ deviceData, relayScheduleForm, setRelayScheduleForm, handleRelayScheduleSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  return (
    <motion.div custom={3} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
      <div className="relative p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3"><div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl"><FaClock className="w-5 h-5 text-white" /></div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Jadwal Otomatis</h2>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={()=>setIsEditing(!isEditing)} className={`p-3 rounded-xl ${isEditing?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}>
            {isEditing ? <FaTimes className="w-4 h-4" /> : <FaEdit className="w-4 h-4" />}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><FaLightbulb className="w-5 h-5 text-yellow-600" /><span className="font-semibold text-gray-700">Lampu UV</span></div>
                  <div className="flex items-center space-x-2"><span className="px-3 py-1 bg-white rounded-lg shadow-sm">{deviceData?.relay_schedules?.uv_light?.on_time || '--:--'}</span><span className="text-gray-400">—</span><span className="px-3 py-1 bg-white rounded-lg shadow-sm">{deviceData?.relay_schedules?.uv_light?.off_time || '--:--'}</span></div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><FaVolumeUp className="w-5 h-5 text-blue-600" /><span className="font-semibold text-gray-700">Ultrasonik</span></div>
                  <div className="flex items-center space-x-2"><span className="px-3 py-1 bg-white rounded-lg shadow-sm">{deviceData?.relay_schedules?.ultrasonic?.on_time || '--:--'}</span><span className="text-gray-400">—</span><span className="px-3 py-1 bg-white rounded-lg shadow-sm">{deviceData?.relay_schedules?.ultrasonic?.off_time || '--:--'}</span></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* UV */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700"><FaLightbulb className="w-4 h-4 text-yellow-600" /><span>Jadwal Lampu UV</span></label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input type="time" value={relayScheduleForm.uv_light.on_time} onChange={e=>setRelayScheduleForm({...relayScheduleForm, uv_light:{...relayScheduleForm.uv_light, on_time:e.target.value}})} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 text-center"/>
                  <span className="hidden sm:block text-gray-400 font-bold">—</span>
                  <input type="time" value={relayScheduleForm.uv_light.off_time} onChange={e=>setRelayScheduleForm({...relayScheduleForm, uv_light:{...relayScheduleForm.uv_light, off_time:e.target.value}})} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 text-center"/>
                </div>
              </div>
              {/* Sonic */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700"><FaVolumeUp className="w-4 h-4 text-blue-600" /><span>Jadwal Suara Ultrasonik</span></label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input type="time" value={relayScheduleForm.ultrasonic.on_time} onChange={e=>setRelayScheduleForm({...relayScheduleForm, ultrasonic:{...relayScheduleForm.ultrasonic, on_time:e.target.value}})} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-center"/>
                  <span className="hidden sm:block text-gray-400 font-bold">—</span>
                  <input type="time" value={relayScheduleForm.ultrasonic.off_time} onChange={e=>setRelayScheduleForm({...relayScheduleForm, ultrasonic:{...relayScheduleForm.ultrasonic, off_time:e.target.value}})} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-center"/>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={()=>{handleRelayScheduleSave(); setIsEditing(false);}} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl">
                <FaSave className="inline w-4 h-4 mr-2" /> Simpan Jadwal
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

const WhatsAppSchedulerCard = memo(({ user, userData }) => {
  const [schedules, setSchedules] = useState({});
  const [newSchedule, setNewSchedule] = useState({ date: '', time: '', note: '', targetNumber: '', message: '' });

  useEffect(()=>{ if (userData?.whatsapp_number) setNewSchedule(p=>({...p, targetNumber:userData.whatsapp_number})); },[userData]);
  useEffect(()=>{
    if (!user.uid) return;
    const schedulesRef = ref(db, `users/${user.uid}/pestisida_schedules`);
    return onValue(schedulesRef, (snap)=> setSchedules(snap.val() || {}));
  },[user.uid]);

  const handleAddSchedule = async (e)=>{
    e.preventDefault();
    const {date,time,note,targetNumber,message} = newSchedule;
    if (!date||!time||!note||!targetNumber||!message) { Swal.fire('Form Tidak Lengkap!','Harap isi semua kolom jadwal.','warning'); return; }
    const scheduleTime = new Date(`${date}T${time}`);
    try{
      await push(ref(db, `users/${user.uid}/pestisida_schedules`), { datetime:scheduleTime.toISOString(), note, targetNumber, message, status:'active', last_sent:null });
      setNewSchedule({ date:'', time:'', note:'', targetNumber:userData?.whatsapp_number||'', message:'' });
      Swal.fire({ title:'Jadwal Ditambahkan!', text:`Pengingat akan dikirim pada ${scheduleTime.toLocaleString('id-ID')}`, icon:'success', customClass:{popup:'rounded-2xl'} });
    }catch{
      Swal.fire({ title:'Error!', text:'Gagal menambahkan jadwal.', icon:'error', customClass:{popup:'rounded-2xl'} });
    }
  };

  const handleDeleteSchedule = async (id)=>{
    const r = await Swal.fire({ title:'Hapus Jadwal?', text:'Tidak bisa dibatalkan.', icon:'warning', showCancelButton:true, confirmButtonText:'Ya, Hapus!', cancelButtonText:'Batal', customClass:{popup:'rounded-2xl',confirmButton:'px-4 py-2 text-white bg-red-600 rounded-lg',cancelButton:'px-4 py-2 text-white bg-gray-500 rounded-lg'}, buttonsStyling:false });
    if (r.isConfirmed){ await remove(ref(db, `users/${user.uid}/pestisida_schedules/${id}`)); Swal.fire({ title:'Berhasil Dihapus!', icon:'success', customClass:{popup:'rounded-2xl'} }); }
  };

  const checkSchedules = useCallback(async ()=>{
    if (!schedules || !userData?.notification_apikey) return;
    const now = new Date();
    for (const [id, s] of Object.entries(schedules)) {
      if (s.status==='active') {
        const t = new Date(s.datetime);
        const isTime = now >= t;
        const last = s.last_sent ? new Date(s.last_sent) : null;
        const sentToday = last && last.getDate()===now.getDate() && last.getMonth()===now.getMonth() && last.getFullYear()===now.getFullYear();
        if (isTime && !sentToday) {
          const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(s.targetNumber)}&apikey=7HpsnhAjXW8n&text=${encodeURIComponent(s.message)}`;
          try{
            const resp = await fetch(url); const txt = await resp.text();
            if (txt.includes("Message sent")) await update(ref(db, `users/${user.uid}/pestisida_schedules/${id}`), { last_sent: new Date().toISOString() });
          }catch(e){ console.error(e); }
        }
      }
    }
  },[schedules,userData,user.uid]);

  useEffect(()=>{ const itv=setInterval(checkSchedules,60000); return ()=>clearInterval(itv); },[checkSchedules]);

  return (
    <motion.div custom={4} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-12 -translate-x-12 opacity-50"></div>
      <div className="relative p-6">
        <div className="flex items-center space-x-3 mb-6"><div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl"><FaBell className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Pengingat WhatsApp</h2></div>
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="date" value={newSchedule.date} onChange={e=>setNewSchedule({...newSchedule,date:e.target.value})} required className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"/>
            <input type="time" value={newSchedule.time} onChange={e=>setNewSchedule({...newSchedule,time:e.target.value})} required className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"/>
          </div>
          <input type="text" value={newSchedule.targetNumber} onChange={e=>setNewSchedule({...newSchedule,targetNumber:e.target.value})} required placeholder="Nomor WA (cth: 62812...)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"/>
          <textarea value={newSchedule.message} onChange={e=>setNewSchedule({...newSchedule,message:e.target.value})} required placeholder="Isi pesan notifikasi..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 resize-none" rows="3"/>
          <textarea value={newSchedule.note} onChange={e=>setNewSchedule({...newSchedule,note:e.target.value})} required placeholder="Catatan pribadi (tidak dikirim)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 resize-none" rows="2"/>
          <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl">
            <FaPlus className="inline w-4 h-4 mr-2" /> Tambah Jadwal
          </motion.button>
        </form>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><BsCalendar3 className="w-4 h-4 mr-2 text-gray-600" />Jadwal Aktif</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            <AnimatePresence>
              {Object.entries(schedules).filter(([_,s])=>s.status==='active').length>0 ?
                Object.entries(schedules).filter(([_,s])=>s.status==='active').sort((a,b)=>new Date(a[1].datetime)-new Date(b[1].datetime)).map(([id,s])=>(
                  <motion.div key={id} layout initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex-1"><p className="font-semibold text-gray-800 text-sm">{new Date(s.datetime).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p><p className="text-sm text-gray-600 mt-1">{s.note}</p></div>
                    <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={()=>handleDeleteSchedule(id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><FaTrash className="w-4 h-4"/></motion.button>
                  </motion.div>
                ))
                : (<p className="text-center text-sm text-gray-500 py-4">Belum ada jadwal aktif</p>)
              }
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ===== NEW: PWM RAW Tuning (0..1023) =====
const PwmTuningCard = memo(({ isOnline, pwmCtl, feedback, onRawChange }) => {
  const synced = typeof feedback?.pwm_raw === 'number' && feedback.pwm_raw === pwmCtl.pwm_raw;
  const pct = Math.round((pwmCtl.pwm_raw / 1023) * 100);
  const freqInfo = feedback?.pwm_freq_ctrl_hz ? `${(feedback.pwm_freq_ctrl_hz/1000).toFixed(1)} kHz (fixed)` : 'Fixed by device';

  return (
    <motion.div custom={2.5} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
      <div className="relative p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Tuning PWM (RAW 0–1023)</h2>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        <div className="p-6 rounded-2xl border bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Nilai RAW (0..1023)</p>
              <h3 className="text-xl font-bold text-gray-800">{pwmCtl.pwm_raw} <span className="text-sm text-gray-500">(~{pct}% )</span></h3>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${synced ? 'bg-white text-emerald-700 border border-emerald-200' : 'bg-emerald-600 text-white'}`}>
              {synced ? 'Tersinkron' : 'Menyinkronkan...'}
            </span>
          </div>
          <input type="range" min={0} max={1023} step={1} value={pwmCtl.pwm_raw} onChange={(e)=>onRawChange(Number(e.target.value))} disabled={!isOnline} className="w-full accent-emerald-600"/>
          <p className="mt-2 text-xs text-gray-500">Frekuensi: {freqInfo} — ESP tidak mengubah frekuensi dari web.</p>
        </div>
      </div>
    </motion.div>
  );
});

// --- MAIN PAGE ---
const DashboardPage = ({ user }) => {
  const [deviceData, setDeviceData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relayScheduleForm, setRelayScheduleForm] = useState({ uv_light: { on_time: '', off_time: '' }, ultrasonic: { on_time: '', off_time: '' } });

  // PWM RAW local state
  const [pwmCtl, setPwmCtl] = useState({ pwm_raw: 512 });
  const writeTimersRef = useRef({});

  useEffect(() => {
    if (!user.uid) return;
    const userRef = ref(db, `users/${user.uid}`);
    get(userRef).then(snapshot => {
      if (!snapshot.exists()) { setLoading(false); return; }
      const uData = snapshot.val(); setUserData(uData);

      if (uData.device_id) {
        const deviceRef = ref(db, `devices/${uData.device_id}`);
        const unsub = onValue(deviceRef, snap => {
          const data = snap.val(); setDeviceData(data);
          if (data?.relay_schedules) {
            setRelayScheduleForm({
              uv_light: { on_time: data.relay_schedules.uv_light?.on_time || '', off_time: data.relay_schedules.uv_light?.off_time || '' },
              ultrasonic: { on_time: data.relay_schedules.ultrasonic?.on_time || '', off_time: data.relay_schedules.ultrasonic?.off_time || '' },
            });
          }
          // Sync initial RAW: controls.pwm_raw > feedback.pwm_raw > pot_percent*1023/100 > 512
          const raw = (typeof data?.controls?.pwm_raw === 'number') ? data.controls.pwm_raw
                    : (typeof data?.feedback?.pwm_raw === 'number') ? data.feedback.pwm_raw
                    : (typeof data?.controls?.pot_percent === 'number') ? Math.round(data.controls.pot_percent * 1023 / 100)
                    : 512;
          setPwmCtl({ pwm_raw: Math.max(0, Math.min(1023, Number(raw))) });
          setLoading(false);
        });
        return () => unsub();
      } else { setLoading(false); }
    });
  }, [user.uid]);

  const handleModeChange = useCallback((control, newMode) => {
    if (!userData?.device_id) return;
    set(ref(db, `devices/${userData.device_id}/control_modes/${control}`), newMode);
  }, [userData]);

  const handleManualToggle = useCallback((control, value) => {
    if (!userData?.device_id) return;
    set(ref(db, `devices/${userData.device_id}/controls/${control}`), value).catch(()=>{
      Swal.fire({ title:'Update Gagal', text:'Gagal mengubah status perangkat.', icon:'error', customClass:{popup:'rounded-2xl'} });
    });
  }, [userData]);

  const handleRelayScheduleSave = useCallback(async () => {
    if (!userData?.device_id) return;
    try{
      await update(ref(db), { [`/devices/${userData.device_id}/relay_schedules`]: relayScheduleForm });
      Swal.fire({ title:'Jadwal Disimpan!', icon:'success', customClass:{popup:'rounded-2xl'} });
    }catch(e){
      Swal.fire({ title:'Error!', text:`Gagal menyimpan jadwal: ${e.message}`, icon:'error', customClass:{popup:'rounded-2xl'} });
    }
  }, [userData, relayScheduleForm]);

  // Auto mode executor (relay only)
  const handleAutoModeCheck = useCallback(() => {
    if (!deviceData?.control_modes || !deviceData?.relay_schedules || !userData?.device_id) return;
    const now = new Date(); const hh = now.getHours().toString().padStart(2,'0'); const mm = now.getMinutes().toString().padStart(2,'0'); const cur = `${hh}:${mm}`;
    ['uv_light','ultrasonic'].forEach(ctrl=>{
      if (deviceData.control_modes[ctrl] !== 'auto') return;
      const sch = deviceData.relay_schedules[ctrl]; const state = !!deviceData.controls?.[ctrl];
      if (sch?.on_time && sch?.off_time){
        const on=sch.on_time, off=sch.off_time; let expect=false;
        if (on>off) expect = (cur>=on || cur<off); else expect = (cur>=on && cur<off);
        if (expect!==state) set(ref(db, `devices/${userData.device_id}/controls/${ctrl}`), expect);
      }
    });
  }, [deviceData, userData?.device_id]);

  useEffect(()=>{ const itv=setInterval(handleAutoModeCheck,15000); return ()=>clearInterval(itv); },[handleAutoModeCheck]);

  // Debounced write RAW
  const onRawChange = useCallback((value)=>{
    setPwmCtl({ pwm_raw:value });
    if (!userData?.device_id) return;
    const key='pwm_raw';
    if (writeTimersRef.current[key]) clearTimeout(writeTimersRef.current[key]);
    writeTimersRef.current[key]=setTimeout(()=>{
      set(ref(db, `devices/${userData.device_id}/controls/${key}`), Number(value)).catch(()=>{
        Swal.fire({ title:'Update Gagal', text:'Tidak bisa mengirim nilai ke perangkat.', icon:'error', customClass:{popup:'rounded-2xl'} });
      });
    }, 200);
  },[userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <motion.div className="absolute w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full" animate={{ rotate: 360 }} transition={{ loop: Infinity, ease: "linear", duration: 1 }}/>
            <motion.div className="absolute w-full h-full border-4 border-transparent border-t-purple-600 rounded-full" animate={{ rotate: -360 }} transition={{ loop: Infinity, ease: "linear", duration: 1.5 }}/>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  // Online check (pakai last_seen server timestamp → toleransi 120s)
  const lastSeen = deviceData?.status?.last_seen || 0;
  const isOnline = deviceData?.status?.is_online && (Date.now() - lastSeen < 120000);
  const uvMode = deviceData?.control_modes?.uv_light || 'manual';
  const ultrasonicMode = deviceData?.control_modes?.ultrasonic || 'manual';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader user={user} />
        <main className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-8 md:col-span-2">
            <StatusCard isOnline={isOnline} />
            <ControlCard deviceData={deviceData} uvMode={uvMode} ultrasonicMode={ultrasonicMode} handleModeChange={handleModeChange} handleManualToggle={handleManualToggle}/>
            <PwmTuningCard isOnline={isOnline} pwmCtl={pwmCtl} feedback={deviceData?.feedback} onRawChange={onRawChange}/>
          </div>
          <div className="space-y-8">
            <ScheduleCard deviceData={deviceData} relayScheduleForm={relayScheduleForm} setRelayScheduleForm={setRelayScheduleForm} handleRelayScheduleSave={handleRelayScheduleSave}/>
            <WhatsAppSchedulerCard user={user} userData={userData}/>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
