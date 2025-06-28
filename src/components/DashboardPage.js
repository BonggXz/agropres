import React, { useState, useEffect, useCallback, memo } from 'react';
import { signOut } from 'firebase/auth';
import { ref, onValue, set, get, push, remove, update } from "firebase/database";
import { auth, db } from '../firebase/config';
import { FaLightbulb, FaVolumeUp, FaTrash, FaPlus, FaSave, FaEdit, FaTimes, FaClock, FaWifi, FaUser, FaBell } from 'react-icons/fa';
import { BsSoundwave, BsWifi, BsWifiOff, BsCalendar3, BsGearFill } from 'react-icons/bs';
import { IoMdLogOut, IoMdNotifications } from "react-icons/io";
import { HiOutlineDevicePhoneMobile, HiSparkles } from "react-icons/hi2";
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
};

// --- UTILITY & UI COMPONENTS (Memoized for Performance) ---

// PERBAIKAN: Komponen CustomSwitch yang lebih andal
const CustomSwitch = memo(({ isChecked, onChange, disabled = false, colorScheme = 'blue' }) => {
  const bgColor = isChecked 
    ? colorScheme === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'
    : 'bg-gradient-to-r from-gray-200 to-gray-300';
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  // Menggunakan div sebagai wrapper untuk mengontrol posisi knob dengan justify-content
  return (
    <div 
      onClick={!disabled ? onChange : undefined} 
      className={`flex items-center h-8 w-14 rounded-full transition-colors duration-300 relative ${cursor} ${bgColor} ${disabled ? 'opacity-50' : ''} p-1 ${isChecked ? 'justify-end' : 'justify-start'}`}
    >
      {/* Knob yang akan dianimasikan */}
      <motion.div 
        layout // Biarkan Framer Motion menangani animasi perpindahan posisi
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className="h-6 w-6 bg-white rounded-full shadow-md" 
      />
       {/* Ikon kilau untuk status "on" */}
       <AnimatePresence>
        {isChecked && (
           <motion.div 
             className="absolute right-2 top-1/2 -translate-y-1/2"
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0, opacity: 0 }}
           >
            <HiSparkles className="w-3 h-3 text-white" />
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const ModeControl = memo(({ mode, onModeChange }) => {
  const baseClasses = "px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 transform";
  const activeClasses = "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25";
  const inactiveClasses = "bg-white text-gray-600 hover:bg-gray-50 shadow-md border border-gray-200";

  return (
    <div className="flex items-center p-1.5 space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-inner">
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onModeChange('manual')} 
        className={`${baseClasses} ${mode === 'manual' ? activeClasses : inactiveClasses}`}
      >
        Manual
      </motion.button>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onModeChange('auto')} 
        className={`${baseClasses} ${mode === 'auto' ? activeClasses : inactiveClasses}`}
      >
        Otomatis
      </motion.button>
    </div>
  );
});

// --- CARD COMPONENTS (Memoized for Performance) ---

const DashboardHeader = memo(({ user }) => {
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Konfirmasi Logout',
      text: 'Apakah Anda yakin ingin keluar?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-2xl shadow-xl',
        confirmButton: 'px-6 py-2.5 text-white bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors',
        cancelButton: 'px-6 py-2.5 text-white bg-gray-500 rounded-lg font-semibold hover:bg-gray-600 transition-colors',
        actions: 'gap-4',
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      try {
        await signOut(auth);
        Swal.fire({
          title: 'Berhasil Logout!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl' }
        });
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'Gagal logout. Silakan coba lagi.',
          icon: 'error',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    }
  };
  
  return (
    <motion.header custom={0} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 mb-8">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-20 translate-x-20 opacity-50"></div>
      <div className="relative flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 gap-4">
        <div className="flex items-center space-x-4">
          <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring' }}
            className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
            <FaWifi className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            {/* PERUBAHAN: Judul diubah sesuai permintaan */}
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Dashboard Agro Pres
            </h1>
            <p className="text-gray-600 mt-2 flex items-center text-sm">
              <FaUser className="w-4 h-4 mr-2" />
              Selamat datang, {user?.email}
            </p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleLogout} 
          className="inline-flex items-center px-6 py-3 text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/20"
        >
          <IoMdLogOut className="w-5 h-5 mr-2" />
          Logout
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Status Perangkat
        </h2>
        <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'} transition-colors`}>
          <HiOutlineDevicePhoneMobile className={`w-6 h-6 ${isOnline ? 'text-green-600' : 'text-red-600'} transition-colors`} />
        </div>
      </div>
      
      <div className={`flex items-center justify-between p-6 rounded-2xl ${
        isOnline 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
          : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
      } transition-all duration-300`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} shadow-lg transition-colors`}>
            <AnimatePresence mode="wait">
              <motion.div key={isOnline ? 'on' : 'off'} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                {isOnline ? <BsWifi className="w-6 h-6 text-white" /> : <BsWifiOff className="w-6 h-6 text-white" />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div>
            <span className={`text-2xl font-bold ${isOnline ? 'text-green-700' : 'text-red-700'} transition-colors`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'} mt-1 transition-colors`}>
              {isOnline ? 'Perangkat terhubung' : 'Perangkat tidak terhubung'}
            </p>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'} transition-colors`}></div>
      </div>
    </div>
  </motion.div>
));

const ControlCard = memo(({ deviceData, uvMode, ultrasonicMode, handleModeChange, handleManualToggle }) => (
  <motion.div custom={2} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
     <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full -translate-y-12 -translate-x-12 opacity-50"></div>
    <div className="relative p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Kontrol Perangkat
        </h2>
        <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
          <BsGearFill className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="space-y-8">
        {/* UV Light Control */}
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <FaLightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Lampu UV</h3>
                <p className="text-sm text-gray-600">Pengendali hama ultraviolet</p>
              </div>
            </div>
            <ModeControl mode={uvMode} onModeChange={(mode) => handleModeChange('uv_light', mode)} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm font-semibold transition-colors ${uvMode === 'manual' ? 'text-gray-700' : 'text-gray-400'}`}>
              Kontrol Manual
            </span>
            <CustomSwitch 
              isChecked={!!deviceData?.controls?.uv_light} 
              onChange={() => handleManualToggle('uv_light', !deviceData?.controls?.uv_light)} 
              disabled={uvMode !== 'manual'} 
              colorScheme="yellow" 
            />
          </div>
        </div>

        {/* Ultrasonic Control */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BsSoundwave className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Suara Ultrasonik</h3>
                <p className="text-sm text-gray-600">Pengusir hama gelombang suara</p>
              </div>
            </div>
            <ModeControl mode={ultrasonicMode} onModeChange={(mode) => handleModeChange('ultrasonic', mode)} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm font-semibold transition-colors ${ultrasonicMode === 'manual' ? 'text-gray-700' : 'text-gray-400'}`}>
              Kontrol Manual
            </span>
            <CustomSwitch 
              isChecked={!!deviceData?.controls?.ultrasonic} 
              onChange={() => handleManualToggle('ultrasonic', !deviceData?.controls?.ultrasonic)} 
              disabled={ultrasonicMode !== 'manual'} 
              colorScheme="blue" 
            />
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
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <FaClock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Jadwal Otomatis
            </h2>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditing(!isEditing)} 
            className={`p-3 rounded-xl transition-all duration-300 ${
              isEditing ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div key={isEditing ? 'close' : 'edit'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                {isEditing ? <FaTimes className="w-4 h-4" /> : <FaEdit className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><FaLightbulb className="w-5 h-5 text-yellow-600" /><span className="font-semibold text-gray-700">Lampu UV</span></div>
                  <div className="flex items-center space-x-2"><span className="px-3 py-1 bg-white text-gray-800 font-medium rounded-lg shadow-sm">{deviceData?.relay_schedules?.uv_light?.on_time || '--:--'}</span><span className="text-gray-400">—</span><span className="px-3 py-1 bg-white text-gray-800 font-medium rounded-lg shadow-sm">{deviceData?.relay_schedules?.uv_light?.off_time || '--:--'}</span></div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><FaVolumeUp className="w-5 h-5 text-blue-600" /><span className="font-semibold text-gray-700">Ultrasonik</span></div>
                  <div className="flex items-center space-x-2"><span className="px-3 py-1 bg-white text-gray-800 font-medium rounded-lg shadow-sm">{deviceData?.relay_schedules?.ultrasonic?.on_time || '--:--'}</span><span className="text-gray-400">—</span><span className="px-3 py-1 bg-white text-gray-800 font-medium rounded-lg shadow-sm">{deviceData?.relay_schedules?.ultrasonic?.off_time || '--:--'}</span></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700"><FaLightbulb className="w-4 h-4 text-yellow-600" /><span>Jadwal Lampu UV</span></label>
                    <div className="flex items-center space-x-3">
                        <input type="time" value={relayScheduleForm.uv_light.on_time} onChange={e => setRelayScheduleForm({...relayScheduleForm, uv_light: {...relayScheduleForm.uv_light, on_time: e.target.value}})} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"/>
                        <span className="text-gray-400 font-bold">—</span>
                        <input type="time" value={relayScheduleForm.uv_light.off_time} onChange={e => setRelayScheduleForm({...relayScheduleForm, uv_light: {...relayScheduleForm.uv_light, off_time: e.target.value}})} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"/>
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700"><FaVolumeUp className="w-4 h-4 text-blue-600" /><span>Jadwal Suara Ultrasonik</span></label>
                    <div className="flex items-center space-x-3">
                        <input type="time" value={relayScheduleForm.ultrasonic.on_time} onChange={e => setRelayScheduleForm({...relayScheduleForm, ultrasonic: {...relayScheduleForm.ultrasonic, on_time: e.target.value}})} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"/>
                        <span className="text-gray-400 font-bold">—</span>
                        <input type="time" value={relayScheduleForm.ultrasonic.off_time} onChange={e => setRelayScheduleForm({...relayScheduleForm, ultrasonic: {...relayScheduleForm.ultrasonic, off_time: e.target.value}})} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"/>
                    </div>
                </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { handleRelayScheduleSave(); setIsEditing(false); }} 
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <FaSave className="w-4 h-4" /><span>Simpan Jadwal</span>
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

  useEffect(() => {
    if (userData?.whatsapp_number) {
      setNewSchedule(prev => ({ ...prev, targetNumber: userData.whatsapp_number }));
    }
  }, [userData]);
  
  useEffect(() => {
    if (!user?.uid) return;
    const schedulesRef = ref(db, `users/${user.uid}/pestisida_schedules`);
    const unsubscribe = onValue(schedulesRef, (snap) => setSchedules(snap.val() || {}));
    return () => unsubscribe();
  }, [user.uid]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.date || !newSchedule.time || !newSchedule.note || !newSchedule.targetNumber || !newSchedule.message) {
      Swal.fire('Form Tidak Lengkap!', 'Harap isi semua kolom jadwal.', 'warning');
      return;
    }
    
    const scheduleTime = new Date(`${newSchedule.date}T${newSchedule.time}`);
    try {
      await push(ref(db, `users/${user.uid}/pestisida_schedules`), {
        datetime: scheduleTime.toISOString(),
        note: newSchedule.note,
        targetNumber: newSchedule.targetNumber,
        message: newSchedule.message,
        status: 'active'
      });
      setNewSchedule({ date: '', time: '', note: '', targetNumber: userData?.whatsapp_number || '', message: '' });
      Swal.fire('Jadwal Ditambahkan!', `Pengingat akan dikirim pada ${scheduleTime.toLocaleString('id-ID')}`, 'success');
    } catch (error) {
      Swal.fire('Error!', 'Gagal menambahkan jadwal.', 'error');
    }
  };

  const handleDeleteSchedule = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Jadwal?',
      text: 'Jadwal yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-4 py-2 text-white bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors',
        cancelButton: 'px-4 py-2 text-white bg-gray-500 rounded-lg font-semibold hover:bg-gray-600 transition-colors',
        actions: 'gap-4',
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      await remove(ref(db, `users/${user.uid}/pestisida_schedules/${id}`));
      Swal.fire('Berhasil Dihapus!', 'Jadwal telah dihapus.', 'success');
    }
  };
  
  // PERBAIKAN: Sistem WhatsApp notification dengan API baru
  const checkSchedules = useCallback(() => {
    if (!schedules || !userData?.textmebot_apikey) return;
    const now = new Date();
    
    Object.entries(schedules).forEach(([id, schedule]) => {
      if (schedule.status === 'active' && new Date(schedule.datetime) <= now) {
        console.log(`Waktunya notifikasi untuk jadwal: ${schedule.note}`);
        const { targetNumber, message } = schedule;
        const apiKey = userData.textmebot_apikey;
        
        // Format nomor telepon untuk TextMeBot API
        let formattedNumber = targetNumber;
        if (!formattedNumber.startsWith('+')) {
          if (formattedNumber.startsWith('0')) {
            formattedNumber = '+62' + formattedNumber.substring(1);
          } else if (formattedNumber.startsWith('62')) {
            formattedNumber = '+' + formattedNumber;
          } else {
            formattedNumber = '+62' + formattedNumber;
          }
        }
        
        // URL API TextMeBot yang diperbaiki
        const url = `http://api.textmebot.com/send.php?recipient=${encodeURIComponent(formattedNumber)}&apikey=${apiKey}&text=${encodeURIComponent(message)}`;
        
        fetch(url)
          .then(res => {
            console.log('Response status:', res.status);
            if (res.ok) {
              set(ref(db, `users/${user.uid}/pestisida_schedules/${id}`), { status: 'sent' });
              console.log('WhatsApp message sent successfully');
            } else {
              console.error('Failed to send WhatsApp message:', res.status);
            }
          })
          .catch(err => console.error('Error sending WhatsApp message:', err));
      }
    });
  }, [schedules, userData, user.uid]);

  useEffect(() => {
    const interval = setInterval(checkSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkSchedules]);

  return (
    <motion.div custom={4} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
      <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-full -translate-y-14 -translate-x-14 opacity-50"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl">
              <IoMdNotifications className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Jadwal Pestisida
            </h2>
          </div>
          <div className="p-2 bg-green-100 rounded-xl">
            <BsCalendar3 className="w-5 h-5 text-green-600" />
          </div>
        </div>

        {/* Form Add Schedule */}
        <form onSubmit={handleAddSchedule} className="space-y-4 mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
          <h3 className="font-semibold text-gray-700 flex items-center space-x-2">
            <FaPlus className="w-4 h-4 text-green-600" />
            <span>Tambah Jadwal Baru</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="date"
              value={newSchedule.date}
              onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              required
            />
            <input
              type="time"
              value={newSchedule.time}
              onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Catatan jadwal (misal: Semprot pestisida area A)"
            value={newSchedule.note}
            onChange={(e) => setNewSchedule({...newSchedule, note: e.target.value})}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            required
          />

          <input
            type="tel"
            placeholder="Nomor WhatsApp (misal: 081234567890)"
            value={newSchedule.targetNumber}
            onChange={(e) => setNewSchedule({...newSchedule, targetNumber: e.target.value})}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            required
          />

          <textarea
            placeholder="Pesan WhatsApp yang akan dikirim"
            value={newSchedule.message}
            onChange={(e) => setNewSchedule({...newSchedule, message: e.target.value})}
            rows="3"
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
            required
          />

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </motion.button>
        </form>

        {/* Schedule List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 flex items-center space-x-2">
            <FaBell className="w-4 h-4 text-blue-600" />
            <span>Jadwal Aktif ({Object.keys(schedules).length})</span>
          </h3>
          
          {Object.keys(schedules).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BsCalendar3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada jadwal pestisida</p>
            </div>
          ) : (
            Object.entries(schedules).map(([id, schedule]) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  schedule.status === 'sent' 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'bg-white border-green-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                        schedule.status === 'sent' 
                          ? 'bg-gray-200 text-gray-600' 
                          : 'bg-green-200 text-green-700'
                      }`}>
                        {schedule.status === 'sent' ? 'Terkirim' : 'Aktif'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(schedule.datetime).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{schedule.note}</h4>
                    <p className="text-sm text-gray-600 mb-1">Ke: {schedule.targetNumber}</p>
                    <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded-lg">
                      "{schedule.message}"
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteSchedule(id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <FaTrash className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
});

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [deviceData, setDeviceData] = useState({});
  const [isOnline, setIsOnline] = useState(false);
  const [uvMode, setUvMode] = useState('manual');
  const [ultrasonicMode, setUltrasonicMode] = useState('manual');
  const [relayScheduleForm, setRelayScheduleForm] = useState({
    uv_light: { on_time: '', off_time: '' },
    ultrasonic: { on_time: '', off_time: '' }
  });

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  // Load user data and device data
  useEffect(() => {
    if (!user?.uid) return;
    
    const userRef = ref(db, `users/${user.uid}`);
    const deviceRef = ref(db, `users/${user.uid}/device_data`);
    
    const unsubscribeUser = onValue(userRef, (snap) => {
      const data = snap.val();
      if (data) {
        setUserData(data);
        setUvMode(data.modes?.uv_light || 'manual');
        setUltrasonicMode(data.modes?.ultrasonic || 'manual');
      }
    });
    
    const unsubscribeDevice = onValue(deviceRef, (snap) => {
      const data = snap.val();
      if (data) {
        setDeviceData(data);
        setIsOnline(true);
        
        // Update relay schedule form with current values
        if (data.relay_schedules) {
          setRelayScheduleForm({
            uv_light: data.relay_schedules.uv_light || { on_time: '', off_time: '' },
            ultrasonic: data.relay_schedules.ultrasonic || { on_time: '', off_time: '' }
          });
        }
      } else {
        setIsOnline(false);
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeDevice();
    };
  }, [user?.uid]);

  // Handle mode changes
  const handleModeChange = async (device, mode) => {
    if (!user?.uid) return;
    
    try {
      // Update both user preferences and device modes
      await update(ref(db, `users/${user.uid}/modes`), { [device]: mode });
      await update(ref(db, `users/${user.uid}/device_data/modes`), { [device]: mode });
      
      if (device === 'uv_light') setUvMode(mode);
      if (device === 'ultrasonic') setUltrasonicMode(mode);
      
      Swal.fire({
        title: 'Mode Diubah!',
        text: `${device === 'uv_light' ? 'Lampu UV' : 'Suara Ultrasonik'} beralih ke mode ${mode}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (error) {
      console.error("Error updating mode:", error);
      Swal.fire('Error!', 'Gagal mengubah mode.', 'error');
    }
  };

  // Handle manual toggle
  const handleManualToggle = async (device, value) => {
    if (!user?.uid) return;
    
    try {
      // PERBAIKAN PENTING: Menggunakan set dengan merge: true untuk partial update
      await update(ref(db, `users/${user.uid}/device_data/controls`), { [device]: value });
      
      Swal.fire({
        title: value ? 'Dinyalakan!' : 'Dimatikan!',
        text: `${device === 'uv_light' ? 'Lampu UV' : 'Suara Ultrasonik'} berhasil ${value ? 'dinyalakan' : 'dimatikan'}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (error) {
      console.error("Error toggling device:", error);
      Swal.fire('Error!', 'Gagal mengubah status perangkat.', 'error');
    }
  };

  // Handle relay schedule save
  const handleRelayScheduleSave = async () => {
    if (!user?.uid) return;
    
    try {
      // PERBAIKAN: Mengupdate path yang benar untuk relay schedules
      await update(ref(db, `users/${user.uid}/device_data/relay_schedules`), relayScheduleForm);
      
      Swal.fire({
        title: 'Jadwal Disimpan!',
        text: 'Jadwal otomatis berhasil diperbarui',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      Swal.fire('Error!', 'Gagal menyimpan jadwal.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <DashboardHeader user={user} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StatusCard isOnline={isOnline} />
            <ControlCard 
              deviceData={deviceData}
              uvMode={uvMode}
              ultrasonicMode={ultrasonicMode}
              handleModeChange={handleModeChange}
              handleManualToggle={handleManualToggle}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScheduleCard 
              deviceData={deviceData}
              relayScheduleForm={relayScheduleForm}
              setRelayScheduleForm={setRelayScheduleForm}
              handleRelayScheduleSave={handleRelayScheduleSave}
            />
            <WhatsAppSchedulerCard user={user} userData={userData} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
