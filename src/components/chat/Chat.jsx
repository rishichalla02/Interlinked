import { useEffect, useRef, useState } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { onSnapshot, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useChatStore } from "../../lib/chatStore"
import { useUserStore } from "../../lib/userStore"

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(
      doc(db, "chats", chatId),
      (res) => {
        if (res.exists()) {
          setChat(res.data());
        }
      },
      (error) => {
        console.error("Error listening to chat:", error);
        setError("Unable to load chat messages");
      }
    );

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0])
      });
    }
  }

  const updateUserChats = async (messageText) => {
    const updatePromises = [];

    // Update current user's chat list
    const updateCurrentUser = async () => {
      try {
        const currentUserChatsRef = doc(db, "userchats", currentUser.id);
        const currentUserChatsSnapshot = await getDoc(currentUserChatsRef);

        if (currentUserChatsSnapshot.exists()) {
          const currentUserChatsData = currentUserChatsSnapshot.data();
          const chatIndex = currentUserChatsData.chats?.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1 && chatIndex !== undefined) {
            const updatedChats = [...currentUserChatsData.chats];
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage: messageText,
              isSeen: true,
              updatedAt: Date.now(),
            };

            await updateDoc(currentUserChatsRef, {
              chats: updatedChats,
            });
          }
        }
      } catch (error) {
        console.warn("Failed to update current user's chat list:", error);
      }
    };

    // Update receiver's chat list
    const updateReceiver = async () => {
      if (!user?.id || user.id === currentUser.id) return;
      
      try {
        const receiverChatsRef = doc(db, "userchats", user.id);
        const receiverChatsSnapshot = await getDoc(receiverChatsRef);

        if (receiverChatsSnapshot.exists()) {
          const receiverChatsData = receiverChatsSnapshot.data();
          const receiverChatIndex = receiverChatsData.chats?.findIndex((c) => c.chatId === chatId);

          if (receiverChatIndex !== -1 && receiverChatIndex !== undefined) {
            const updatedReceiverChats = [...receiverChatsData.chats];
            updatedReceiverChats[receiverChatIndex] = {
              ...updatedReceiverChats[receiverChatIndex],
              lastMessage: messageText,
              isSeen: false,
              updatedAt: Date.now(),
            };

            await updateDoc(receiverChatsRef, {
              chats: updatedReceiverChats,
            });
          }
        }
      } catch (error) {
        console.warn("Failed to update receiver's chat list:", error);
        // This is expected to fail with current rules, but message still sent
      }
    };

    // Run both updates
    updatePromises.push(updateCurrentUser());
    updatePromises.push(updateReceiver());

    // Wait for both but don't fail if receiver update fails
    await Promise.allSettled(updatePromises);
  };

  const handleSend = async () => {
    if (text === "" || loading) return;
    if (!currentUser?.id || !chatId) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError("");

    let imgUrl = null;
    const messageText = text.trim();

    try {
      // if (img.file) {
      //   imgUrl = await upload(img.file);
      // }

      // First, update the chat document with the new message
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text: messageText,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      // Clear form immediately after successful chat update
      setText("");
      setImg({
        file: null,
        url: "",
      });

      // Update user chats (both sender and receiver)
      await updateUserChats(messageText);

    } catch (err) {
      console.error("Error sending message:", err);

      // Handle specific Firebase errors
      if (err.code === 'permission-denied') {
        setError("Permission denied. Please check your access rights.");
      } else if (err.code === 'not-found') {
        setError("Chat not found. Please refresh and try again.");
      } else if (err.code === 'unauthenticated') {
        setError("Please log in to send messages.");
      } else {
        setError("Failed to send message. Please try again.");
      }

      // Don't clear the form if there was an error
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem, ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">
        {error && (
          <div className="error-message" style={{
            background: '#ff4444',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            margin: '10px',
            textAlign: 'center'
          }}>
            {error}
            <button
              onClick={() => setError("")}
              style={{
                marginLeft: '10px',
                background: 'transparent',
                border: '1px solid white',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}

        {chat?.messages?.map((message, index) => (
          <div
            className={message.senderId === currentUser?.id ? "message own" : "message"}
            key={message?.createdAt ? `${message.createdAt.seconds || message.createdAt}_${message.senderId}` : `${index}_${message.senderId}`}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
            </div>
          </div>
        ))}

        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}

        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
            accept="image/*"
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>

        <input
          type="text"
          placeholder={
            (isCurrentUserBlocked || isReceiverBlocked)
              ? "You cannot send a message!"
              : loading
                ? "Sending..."
                : "Type a message.."
          }
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isCurrentUserBlocked || isReceiverBlocked || loading}
        />

        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          />
          <div className="picker">
            <EmojiPicker open={open && !loading} onEmojiClick={handleEmoji} />
          </div>
        </div>

        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked || loading || !text.trim()}
          style={{
            opacity: (isCurrentUserBlocked || isReceiverBlocked || loading || !text.trim()) ? 0.5 : 1,
            cursor: (isCurrentUserBlocked || isReceiverBlocked || loading || !text.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  )
}

export default Chat