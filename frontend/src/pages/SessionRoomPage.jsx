import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../services/api';
import socketService from '../services/socket';
import useAuthStore from '../store/authStore';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  Square3Stack3DIcon,
  CodeBracketIcon,
  CursorArrowRaysIcon,
  ArrowLeftIcon,
  PhoneArrowDownLeftIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicSolid,
  VideoCameraIcon as VideoSolid,
} from '@heroicons/react/24/solid';

// Load Jitsi Meet API
const loadJitsiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

function SessionRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState('video'); // video, whiteboard, code, chat
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [whiteboardData, setWhiteboardData] = useState([]);
  const [codeContent, setCodeContent] = useState('// Start coding here...');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [jitsiApi, setJitsiApi] = useState(null);
  
  const videoRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const screenStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSession();
    initializeSocket();
    initializeJitsi();
    
    return () => {
      cleanup();
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSession = async () => {
    try {
      const res = await sessionsAPI.getById(id);
      setSession(res.data.data.session);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeJitsi = async () => {
    try {
      await loadJitsiScript();
      
      const domain = 'meet.jit.si';
      const options = {
        roomName: `TutorXpert_Session_${id}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user.name,
          email: user.email
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      
      // Event listeners
      api.addEventListener('videoConferenceJoined', () => {
        console.log('Joined video conference');
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('Left video conference');
      });

      api.addEventListener('audioMuteStatusChanged', ({ muted }) => {
        setIsMuted(muted);
      });

      api.addEventListener('videoMuteStatusChanged', ({ muted }) => {
        setIsVideoOff(muted);
      });

      api.addEventListener('screenSharingStatusChanged', ({ on }) => {
        setIsScreenSharing(on);
      });

      setJitsiApi(api);
    } catch (error) {
      console.error('Failed to initialize Jitsi:', error);
    }
  };

  const initializeSocket = () => {
    // Join session room
    socketService.joinSession(id, user.userId);

    // Listen for events
    socketService.on('session_chat', handleNewMessage);
    socketService.on('user_joined', handleUserJoined);
    socketService.on('user_left', handleUserLeft);
    socketService.on('whiteboard_update', handleWhiteboardUpdate);
    socketService.on('code_update', handleCodeUpdate);
    socketService.on('screen_share_start', handleScreenShareStart);
    socketService.on('screen_share_end', handleScreenShareEnd);
  };

  const cleanup = () => {
    if (jitsiApi) {
      jitsiApi.dispose();
    }
    socketService.leaveSession(id, user.userId);
    socketService.off('session_chat');
    socketService.off('user_joined');
    socketService.off('user_left');
    socketService.off('whiteboard_update');
    socketService.off('code_update');
    socketService.off('screen_share_start');
    socketService.off('screen_share_end');
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleNewMessage = (data) => {
    if (data.sessionId === id) {
      setMessages((prev) => [...prev, data.message]);
    }
  };

  const handleUserJoined = (data) => {
    if (data.sessionId === id) {
      setParticipants((prev) => [...prev, { userId: data.userId, joinedAt: data.timestamp }]);
    }
  };

  const handleUserLeft = (data) => {
    if (data.sessionId === id) {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    }
  };

  const handleWhiteboardUpdate = (data) => {
    if (data.sessionId === id) {
      setWhiteboardData((prev) => [...prev, data.drawing]);
    }
  };

  const handleCodeUpdate = (data) => {
    if (data.sessionId === id) {
      setCodeContent(data.code);
    }
  };

  const handleScreenShareStart = (data) => {
    if (data.sessionId === id && data.userId !== user.userId) {
      // Remote user started screen sharing
    }
  };

  const handleScreenShareEnd = (data) => {
    if (data.sessionId === id) {
      setIsScreenSharing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      sessionId: id,
      message: newMessage,
      messageType: 'text',
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
    };

    socketService.sendChatMessage(messageData);
    setNewMessage('');
  };

  const toggleMute = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleAudio');
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleVideo');
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleShareScreen');
    }
  };

  const sendWhiteboardDrawing = (drawing) => {
    socketService.sendWhiteboardUpdate({
      sessionId: id,
      drawing,
      userId: user.userId,
    });
  };

  const sendCodeUpdate = (code) => {
    socketService.sendCodeUpdate({
      sessionId: id,
      code,
      language: 'javascript',
      userId: user.userId,
    });
  };

  const endSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      cleanup();
      navigate('/dashboard/sessions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-900 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/sessions')}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-semibold">{session?.subject_name || 'Session'}</h1>
            <p className="text-sm text-neutral-400">
              {participants.length + 1} participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={endSession}
            className="flex items-center gap-2 px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg transition-colors"
          >
            <PhoneArrowDownLeftIcon className="w-5 h-5" />
            End Session
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Video/Content Area */}
          <div className="flex-1 relative bg-neutral-900">
            {activeTool === 'video' && (
              <div ref={jitsiContainerRef} className="absolute inset-0" />
            )}

            {activeTool === 'whiteboard' && (
              <Whiteboard
                sessionId={id}
                onData={sendWhiteboardDrawing}
                existingData={whiteboardData}
              />
            )}

            {activeTool === 'code' && (
              <CodeEditor
                value={codeContent}
                onChange={(code) => {
                  setCodeContent(code);
                  sendCodeUpdate(code);
                }}
              />
            )}

            {activeTool === 'chat' && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <p>Open the chat panel to send messages</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="h-20 bg-neutral-800 border-t border-neutral-700 flex items-center justify-center gap-4 px-6">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-danger-500 hover:bg-danger-600' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              {isMuted ? (
                <MicrophoneIcon className="w-6 h-6 text-white" />
              ) : (
                <MicSolid className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff ? 'bg-danger-500 hover:bg-danger-600' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              {isVideoOff ? (
                <VideoCameraIcon className="w-6 h-6 text-white" />
              ) : (
                <VideoSolid className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-colors ${
                isScreenSharing ? 'bg-primary-500 hover:bg-primary-600' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              <Square3Stack3DIcon className="w-6 h-6 text-white" />
            </button>

            <div className="w-px h-8 bg-neutral-700" />

            <button
              onClick={() => setActiveTool('video')}
              className={`p-4 rounded-full transition-colors ${
                activeTool === 'video' ? 'bg-primary-500' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              <VideoCameraIcon className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={() => setActiveTool('whiteboard')}
              className={`p-4 rounded-full transition-colors ${
                activeTool === 'whiteboard' ? 'bg-primary-500' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              <CursorArrowRaysIcon className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={() => setActiveTool('code')}
              className={`p-4 rounded-full transition-colors ${
                activeTool === 'code' ? 'bg-primary-500' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              <CodeBracketIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-neutral-800 border-l border-neutral-700 flex flex-col">
          <div className="h-14 border-b border-neutral-700 flex items-center px-4">
            <h2 className="text-white font-semibold">Chat</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.senderId === user.userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg ${
                    msg.senderId === user.userId
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-700 text-white'
                  }`}
                >
                  {msg.senderId !== user.userId && (
                    <p className="text-xs text-neutral-400 mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-neutral-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-700 text-white placeholder-neutral-400 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={sendMessage}
                className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Whiteboard Component
function Whiteboard({ sessionId, onData, existingData }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Send drawing data
    onData({ type: 'draw', x, y, color, brushSize });
  };

  return (
    <div className="absolute inset-0 bg-neutral-800">
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer"
        />
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-24"
        />
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }}
          className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={window.innerWidth - 320}
        height={window.innerHeight - 140}
        className="cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}

// Code Editor Component
function CodeEditor({ value, onChange }) {
  return (
    <div className="absolute inset-0 bg-neutral-900 p-4">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-400 text-sm">JavaScript</span>
          <button className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm">
            Run Code
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-neutral-800 text-white font-mono text-sm p-4 rounded-lg outline-none resize-none"
          placeholder="// Write your code here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export default SessionRoomPage;
