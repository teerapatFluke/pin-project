import { useState, useEffect, useMemo } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './index.css'
import ribbon from './assets/ribbon.png'
import { faker } from '@faker-js/faker'
import Swal from 'sweetalert2'

// Import all images from pin folder
import pin1 from './assets/pin/S__16629763_0.jpg'
import pin2 from './assets/pin/S__16629764_0.jpg'
import pin3 from './assets/pin/S__16629765_0.jpg'
import pin4 from './assets/pin/S__16629766_0.jpg'
import pin5 from './assets/pin/S__16629767_0.jpg'
import pin6 from './assets/pin/S__16629768_0.jpg'
import pin7 from './assets/pin/S__16629769_0.jpg'
import pin8 from './assets/pin/S__16629770_0.jpg'
import pin9 from './assets/pin/S__16629771_0.jpg'
import pin10 from './assets/pin/S__16629772_0.jpg'
import pin11 from './assets/pin/S__16629773.jpg'

const pinImages = [pin1, pin2, pin3, pin4, pin5, pin6, pin7, pin8, pin9, pin10, pin11]

const randomMessages = [
  "ดีใจที่ได้เจอกันนะคะ หวังว่าอาจารย์จะเป็นความทรงจำที่ดีของนักเรียนนะคะ ทุกคนจะอยู่ในใจอาจารย์เสมอ🫶🏻",
  "แยกย้ายกันไปเจอเรื่องใหม่ ๆ ที่น่าตื่นเต้น แล้วเดี๋ยวเราเอามาเล่าให้กันฟังในวันหน้านะคะ",
  "เดี๋ยวเอาไว้เจอกันใหม่นะคะ อย่าลืมกันไปซะก่อนนะ ไม่งั้นจะงอนจริงด้วย รักนักเรียนทุกคนเลยนะคะ",
  "ขอบคุณที่ตั้งใจพิมพ์มาให้กันนะคะ อาจารย์อ่านแล้วจะต้องยิ้มแก้มปริแน่เลย ขอบคุณที่น่ารักและเป็นความทรงจำที่ดีของอาจารย์เหมือนกันค่ะ",
  "ขอให้นักเรียนโชคดีกับเส้นทางข้างหน้านะคะ ไม่ว่าจะเจออุปสรรคอะไร ขอให้เชื่อมั่นในตัวเองแล้วผ่านมันไปให้ได้นะคะ อาจารย์เป็นกำลังใจให้",
  "ถึงจะไม่ได้เรียนด้วยกันแล้ว แต่ถ้าวันไหนเหนื่อย ท้อ หรือมีเรื่องน่ายินดี ทักมาหาหรือแวะมาอวดให้อาจารย์ฟังได้เสมอนะคะ",
  "ขอบคุณสำหรับทุกตัวอักษรที่พิมพ์มาให้นะคะ เป็นกำลังใจที่ดีมากๆ เลย ดีใจที่เราได้มาเจอกันนะ ขอให้โชคดีและสนุกกับทุกวันนะคะ อย่าลืมแวะมาทักทายกันบ้างน้า เดี๋ยวคิดถึงแย่เลย",
  "งู้ยยย อ่านแล้วน้ำตาจะไหล (แต่กลั้นไว้เดี๋ยวไม่เท่) ขอบคุณสำหรับความรู้สึกดีๆ ที่ส่งมาให้นะคะ ดูแลตัวเองกันดีๆ น้า เหนื่อยเมื่อไหร่ก็ทักมาระบายได้เสมอ รักนะคะพวกเด็กดื้อ"
]

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('CONNECTING')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Determine page based on route
  const page = location.pathname === '/feeling' ? 3 : location.pathname === '/card' ? 2 : location.pathname === '/admin' ? 4 : 1

  // Random image selected on mount/refresh
  const randomPinImage = useMemo(() => {
    return pinImages[Math.floor(Math.random() * pinImages.length)]
  }, [])

  // Random message selected on mount/refresh
  const randomMessage = useMemo(() => {
    return randomMessages[Math.floor(Math.random() * randomMessages.length)]
  }, [])

  useEffect(() => {
    // Handle switching background based on the page
    if (page === 2) {
      document.body.classList.add('page-2')
    } else {
      document.body.classList.remove('page-2')
    }

    // Fetch messages when entering page 3 or 4
    if (page === 3 || page === 4) {
      fetchMessages()
      
      // Auto-refresh every 5 seconds on page 3 (silent mode)
      if (page === 3) {
        const interval = setInterval(() => {
          fetchMessages(true)
        }, 5000)

        return () => clearInterval(interval)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    fetchMessages()

    const subscription = supabase
      .channel('main_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [payload.new, ...prev])
      })
      .subscribe((status) => setStatus(status))

    // Set a random animal name as default
    const randomAnimal = faker.animal.type()
    setName(randomAnimal.charAt(0).toUpperCase() + randomAnimal.slice(1))

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Fetched messages:', data, 'Error:', error)
    
    if (data) setMessages(data)
    if (!silent) setLoading(false)
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'อุ๊ปส์...',
        text: 'กรุณาพิมพ์ข้อความก่อนส่งนะจ๊ะ!',
        confirmButtonColor: '#f472b6',
      })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            name: name || 'Anonymous', 
            content: message 
          }
        ])

      if (error) throw error

      // Success!
      Swal.fire({
        icon: 'success',
        title: 'ส่งความในใจเรียบร้อย!',
        text: 'อ.ปิ่น ยิ้มแก้มปริแน่นอน 💖',
        confirmButtonColor: '#10b981',
        timer: 3000,
        timerProgressBar: true,
      })
      setMessage('')
      navigate('/card') // Go to page 2 after submitting
    } catch (error) {
      console.error('Error sending message:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message,
        confirmButtonColor: '#ef4444',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === 'pinandchinchan') {
      setIsAdmin(true)
      setAdminPassword('')
    } else {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ถูกต้อง',
        text: 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#ef4444',
      })
    }
  }

  const handleDeleteMessage = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณต้องการลบข้อความนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      console.log('Attempting to delete message with id:', id)
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .select()

      console.log('Delete result - data:', data, 'error:', error)

      if (error) {
        console.error('Delete error:', error)
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message,
          confirmButtonColor: '#ef4444',
        })
      } else {
        console.log('Delete successful, deleted:', data)
        Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false
        })
        // Update local state immediately
        setMessages(prev => prev.filter(msg => msg.id !== id))
      }
    }
  }

  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // --- RENDERING ---

  if (page === 4) {
    if (!isAdmin) {
      return (
        <div className="admin-login-page">
          <div className="admin-login-box">
            <h1>🔐 Admin Login</h1>
            <input
              type="password"
              className="admin-password-input"
              placeholder="ใส่รหัสผ่าน"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <button className="admin-login-btn" onClick={handleAdminLogin}>
              เข้าสู่ระบบ
            </button>
            <button className="back-btn" onClick={() => navigate('/')}>
              ← กลับหน้าแรก
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <h1 className="admin-title">📊 Admin Panel</h1>
            <div className="admin-actions">
              <button className="logout-btn" onClick={() => setIsAdmin(false)}>
                ออกจากระบบ
              </button>
              <button className="back-btn" onClick={() => navigate('/')}>
                ← กลับหน้าแรก
              </button>
            </div>
          </div>

          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 ค้นหาข้อความ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading">กำลังโหลด...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>ชื่อ</th>
                    <th>ข้อความ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((msg) => (
                      <tr key={msg.id}>
                        <td>{new Date(msg.created_at).toLocaleString('th-TH')}</td>
                        <td>{msg.name}</td>
                        <td className="message-cell">{msg.content}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteMessage(msg.id)}
                          >
                            🗑️ ลบ
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                        {searchQuery ? 'ไม่พบข้อความที่ค้นหา' : 'ยังไม่มีข้อความ'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- RENDERING ---

  if (page === 3) {
    return (
      <div className="messages-page">
        <div className="messages-container">
          <h1 className="messages-title">ความรู้สึกทั้งหมด 💖</h1>
          <button className="back-btn" onClick={() => navigate('/')}>
            ← กลับ
          </button>
          
          {loading ? (
            <div className="loading">กำลังโหลด...</div>
          ) : messages.length === 0 ? (
            <div className="loading">ยังไม่มีความรู้สึกที่ส่งมา 💭</div>
          ) : (
            <div className="messages-grid">
              {messages.map((msg) => (
                <div key={msg.id} className="message-card">
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (page === 2) {
    return (
      <div className="page-2-container animate-fade-in">
        <div className="paper-stack">
          {/* Back Layer */}
          <div className="paper-card back"></div>
          
          {/* Middle Layer */}
          <div className="paper-card middle"></div>
          
          {/* Front Main Layer */}
          <div className="paper-card front">
            {/* Heart-shaped photo top-right */}
            <div className="heart-photo-wrapper">
              <img src={randomPinImage} alt="profile" className="heart-photo" />
            </div>
            <h1 className="paper-title">
              Pinchan<br/>
              love<br/>
              you
            </h1>
            
            <div className="paper-content">
              <p>
                {randomMessage}
              </p>
              <button className="view-messages-btn" onClick={() => navigate('/feeling')}>
                ดูความรู้สึกทั้งหมด 💌
              </button>
            </div>

            <div className="paper-price">
              Satit CMU
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-container animate-fade-in">
      <div className="white-card">
        <img src={ribbon} alt="ribbon" className="ribbon" />
        <h2 className="card-title">ความในใจให้ อ.ปิ่นจัง</h2>
        
        <div className="message-box-container">
          <label className="input-label">จากคุณ:</label>
          <input 
            type="text" 
            className="name-input" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ใส่ชื่อของคุณ (หรือไม่ใส่ก็ได้นะ)"
          />
          <label className="input-label">ข้อความ:</label>
          <textarea 
            className="pink-message-box" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="พิมพ์ความในใจที่นี่..."
          ></textarea>
          
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'กำลังส่งความสุข...' : 'กดปุ๊บ... ยิ้มปั๊บ 💖'}
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </HashRouter>
  )
}

export default App
