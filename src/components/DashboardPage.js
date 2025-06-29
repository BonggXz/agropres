import React, { useState, useEffect, useCallback, memo } from 'react';
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
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
};

// --- UTILITY & UI COMPONENTS (Memoized for Performance) ---

const CustomSwitch = memo(({ isChecked, onChange, disabled = false, colorScheme = 'blue' }) => {
  const bgColor = isChecked 
    ? colorScheme === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'
    : 'bg-gradient-to-r from-gray-200 to-gray-300';
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  return (
    <div 
      onClick={!disabled ? onChange : undefined} 
      className={`flex items-center h-8 w-14 rounded-full transition-colors duration-300 relative ${cursor} ${bgColor} ${disabled ? 'opacity-50' : ''} p-1 ${isChecked ? 'justify-end' : 'justify-start'}`}
    >
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className="h-6 w-6 bg-white rounded-full shadow-md" 
      />
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
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input 
                          type="time" 
                          value={relayScheduleForm.uv_light.on_time} 
                          onChange={e => setRelayScheduleForm({...relayScheduleForm, uv_light: {...relayScheduleForm.uv_light, on_time: e.target.value}})} 
                          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 text-center text-gray-800"
                        />
                        <span className="text-gray-400 font-bold hidden sm:block">—</span>
                        <input 
                          type="time" 
                          value={relayScheduleForm.uv_light.off_time} 
                          onChange={e => setRelayScheduleForm({...relayScheduleForm, uv_light: {...relayScheduleForm.uv_light, off_time: e.target.value}})} 
                          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 text-center text-gray-800"
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700"><FaVolumeUp className="w-4 h-4 text-blue-600" /><span>Jadwal Suara Ultrasonik</span></label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input 
                          type="time" 
                          value={relayScheduleForm.ultrasonic.on_time} 
                          onChange={e => setRelayScheduleForm({...relayScheduleForm, ultrasonic: {...relayScheduleForm.ultrasonic, on_time: e.target.value}})} 
                          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center text-gray-800"
                        />
                        <span className="text-gray-400 font-bold hidden sm:block">—</span>
                        <input 
                          type="time" 
                          value={relayScheduleForm.ultrasonic.off_time} 
                          onChange={e => setRelayScheduleForm({...relayScheduleForm, ultrasonic: {...relayScheduleForm.ultrasonic, off_time: e.target.value}})} 
                          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center text-gray-800"
                        />
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
    if (!user.uid) return;
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
      Swal.fire({
        title: 'Jadwal Ditambahkan!',
        text: `Pengingat akan dikirim pada ${scheduleTime.toLocaleString('id-ID')}`,
        icon: 'success',
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Gagal menambahkan jadwal.',
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
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
        popup: 'rounded-2xl shadow-xl',
        confirmButton: 'px-4 py-2 text-white bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors',
        cancelButton: 'px-4 py-2 text-white bg-gray-500 rounded-lg font-semibold hover:bg-gray-600 transition-colors',
        actions: 'gap-4',
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      await remove(ref(db, `users/${user.uid}/pestisida_schedules/${id}`));
      Swal.fire({
        title: 'Berhasil Dihapus!',
        text: 'Jadwal telah dihapus.',
        icon: 'success',
        customClass: { popup: 'rounded-2xl' }
      });
    }
  };
  
  // Fixed WhatsApp schedule handler
  const checkSchedules = useCallback(() => {
    if (!schedules || !userData?.notification_apikey) return; 

    const now = new Date();
    Object.entries(schedules).forEach(([id, schedule]) => {
      if (schedule.status === 'active' && new Date(schedule.datetime) <= now) {
        console.log(`Waktunya notifikasi untuk jadwal: ${schedule.note}`);
        const { targetNumber, message } = schedule;
        
        const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(targetNumber)}&apikey=7HpsnhAjXW8n&text=${encodeURIComponent(message)}`;

        fetch(url)
          .then(res => res.text())
          .then(responseText => {
            if (responseText.includes("Message sent")) {
              console.log("Notifikasi WhatsApp berhasil dikirim");
              update(ref(db, `users/${user.uid}/pestisida_schedules/${id}`), { status: 'sent' });
            } else {
              console.error("Gagal mengirim:", responseText);
            }
          })
          .catch(err => console.error("Gagal mengirim notifikasi:", err));
      }
    });
  }, [schedules, userData, user.uid]);

  useEffect(() => {
    const interval = setInterval(checkSchedules, 60000);
    return () => clearInterval(interval);
  }, [checkSchedules]);

  return (
    <motion.div custom={4} variants={cardVariants} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-12 -translate-x-12 opacity-50"></div>
      <div className="relative p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl"><FaBell className="w-5 h-5 text-white" /></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Pengingat WhatsApp</h2>
        </div>
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input 
              type="date" 
              value={newSchedule.date} 
              onChange={e => setNewSchedule({...newSchedule, date: e.target.value})} 
              required 
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-800"
            />
            <input 
              type="time" 
              value={newSchedule.time} 
              onChange={e => setNewSchedule({...newSchedule, time: e.target.value})} 
              required 
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-800"
            />
          </div>
          <input 
            type="text" 
            value={newSchedule.targetNumber} 
            onChange={e => setNewSchedule({...newSchedule, targetNumber: e.target.value})} 
            required 
            placeholder="Nomor WA (cth: 62812...)" 
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-800"
          />
          <textarea 
            value={newSchedule.message} 
            onChange={e => setNewSchedule({...newSchedule, message: e.target.value})} 
            required 
            placeholder="Isi pesan notifikasi..." 
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-gray-800" 
            rows="3"
          />
          <textarea 
            value={newSchedule.note} 
            onChange={e => setNewSchedule({...newSchedule, note: e.target.value})} 
            required 
            placeholder="Catatan pribadi (tidak dikirim)" 
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-gray-800" 
            rows="2"
          />
          <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
            <FaPlus className="w-4 h-4" /><span>Tambah Jadwal</span>
          </motion.button>
        </form>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><BsCalendar3 className="w-4 h-4 mr-2 text-gray-600" />Jadwal Aktif</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {Object.entries(schedules).filter(([_, s]) => s.status === 'active').length > 0 ? 
                Object.entries(schedules)
                  .filter(([_, s]) => s.status === 'active')
                  .sort((a, b) => new Date(a[1].datetime) - new Date(b[1].datetime))
                  .map(([id, schedule]) => (
                    <motion.div key={id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{new Date(schedule.datetime).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                        <p className="text-sm text-gray-600 mt-1">{schedule.note}</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteSchedule(id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><FaTrash className="w-4 h-4" /></motion.button>
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


// --- MAIN PAGE COMPONENT ---

const DashboardPage = ({ user }) => {
  const [deviceData, setDeviceData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relayScheduleForm, setRelayScheduleForm] = useState({ 
    uv_light: { on_time: '', off_time: '' }, 
    ultrasonic: { on_time: '', off_time: '' }
  });

  useEffect(() => {
    if (!user.uid) return;
    const userRef = ref(db, `users/${user.uid}`);
    
    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const uData = snapshot.val();
        setUserData(uData);

        if (uData.device_id) {
          const deviceRef = ref(db, `devices/${uData.device_id}`);
          const unsubscribe = onValue(deviceRef, snap => {
            const data = snap.val();
            setDeviceData(data);
            if (data?.relay_schedules) {
              // Pastikan form tidak di-reset jika data dari firebase belum lengkap
              const currentSchedules = {
                uv_light: { on_time: data.relay_schedules.uv_light?.on_time || '', off_time: data.relay_schedules.uv_light?.off_time || '' },
                ultrasonic: { on_time: data.relay_schedules.ultrasonic?.on_time || '', off_time: data.relay_schedules.ultrasonic?.off_time || '' },
              }
              setRelayScheduleForm(currentSchedules);
            }
            setLoading(false);
          });
          return () => unsubscribe();
        } else setLoading(false);
      } else setLoading(false);
    });
  }, [user.uid]);

  const handleModeChange = useCallback((control, newMode) => {
    if (!userData?.device_id) return;
    set(ref(db, `devices/${userData.device_id}/control_modes/${control}`), newMode);
  }, [userData]);

  const handleManualToggle = useCallback((control, value) => {
    if (!userData?.device_id) return;

    const controlRef = ref(db, `devices/${userData.device_id}/controls/${control}`);
    set(controlRef, value).catch(error => {
        console.error("Gagal update ke Firebase:", error);
        Swal.fire({
          title: 'Update Gagal', 
          text: 'Gagal mengubah status perangkat. Cek koneksi Anda.', 
          icon: 'error',
          customClass: { popup: 'rounded-2xl' }
        });
    });
  }, [userData]);
  
  const handleRelayScheduleSave = useCallback(async () => {
    if (!userData?.device_id) return;
    
    try {
      await update(ref(db), {
        [`/devices/${userData.device_id}/relay_schedules`]: relayScheduleForm
      });
      Swal.fire({
        title: 'Jadwal Disimpan!',
        text: 'Jadwal otomatis telah diperbarui.',
        icon: 'success',
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: `Gagal menyimpan jadwal: ${error.message}`,
        icon: 'error',
        customClass: { popup: 'rounded-2xl' }
      });
    }
  }, [userData, relayScheduleForm]);

  // Fixed auto mode schedule execution
  const handleAutoModeCheck = useCallback(() => {
    if (!deviceData?.control_modes || !deviceData?.relay_schedules || !userData?.device_id) {
      return;
    }

    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    
    const controlsToCheck = ['uv_light', 'ultrasonic'];

    controlsToCheck.forEach(control => {
      const mode = deviceData.control_modes[control];
      
      // Hanya proses jika mode adalah 'auto'
      if (mode === 'auto') {
        const schedule = deviceData.relay_schedules[control];
        const currentState = deviceData.controls?.[control] ?? false;

        if (schedule && schedule.on_time && schedule.off_time) {
          const { on_time, off_time } = schedule;
          let expectedState = false;

          // Cek jika jadwal melewati tengah malam (misal: 22:00 - 05:00)
          if (on_time > off_time) { 
            if (currentTime >= on_time || currentTime < off_time) {
              expectedState = true;
            }
          } else { // Jadwal di hari yang sama (misal: 08:00 - 17:00)
            if (currentTime >= on_time && currentTime < off_time) {
              expectedState = true;
            }
          }
          
          // Jika status yang diharapkan berbeda dengan status saat ini, update Firebase
          if (expectedState !== currentState) {
            console.log(`Mode Otomatis: Mengubah status ${control} menjadi ${expectedState}`);
            set(ref(db, `devices/${userData.device_id}/controls/${control}`), expectedState);
          }
        }
      }
    });
  }, [deviceData, userData?.device_id]);

  // Menjalankan pengecekan jadwal otomatis secara periodik
  useEffect(() => {
    const interval = setInterval(handleAutoModeCheck, 15000); 
    return () => clearInterval(interval);
  }, [handleAutoModeCheck]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <motion.div 
              className="absolute w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ loop: Infinity, ease: "linear", duration: 1 }}
            />
            <motion.div 
              className="absolute w-full h-full border-4 border-transparent border-t-purple-600 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ loop: Infinity, ease: "linear", duration: 1.5 }}
            />
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  const isOnline = deviceData?.status?.is_online && (Date.now() / 1000 - deviceData.status.last_seen < 120);
  const uvMode = deviceData?.control_modes?.uv_light || 'manual';
  const ultrasonicMode = deviceData?.control_modes?.ultrasonic || 'manual';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader user={user} />
        
        {/* PERBAIKAN LAYOUT: Grid responsive */}
        <main className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="space-y-8 md:col-span-2">
            <StatusCard isOnline={isOnline} />
            <ControlCard 
              deviceData={deviceData}
              uvMode={uvMode}
              ultrasonicMode={ultrasonicMode}
              handleModeChange={handleModeChange}
              handleManualToggle={handleManualToggle}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <ScheduleCard 
              deviceData={deviceData}
              relayScheduleForm={relayScheduleForm}
              setRelayScheduleForm={setRelayScheduleForm}
              handleRelayScheduleSave={handleRelayScheduleSave}
            />
            <WhatsAppSchedulerCard user={user} userData={userData} />
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
