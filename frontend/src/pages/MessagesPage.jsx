import { useState } from 'react';
import useAuthStore from '../store/authStore';

function MessagesPage() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="h-[calc(100vh-140px)] card overflow-hidden">
      <div className="flex h-full">
        {/* Chat List */}
        <div className="w-80 border-r border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">Messages</h2>
          </div>
          <div className="overflow-y-auto h-full">
            <div className="p-4 text-center text-neutral-500 text-sm">
              No messages yet
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
