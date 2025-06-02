import { useEffect, useState } from "react";
import "./chatList.css"
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
const ChatList = () => {

  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    // Check if currentUser exists before making Firestore calls
    if (!currentUser?.id) return;

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        // Check if document exists and has chats data
        if (!res.exists() || !res.data()?.chats) {
          setChats([]);
          return;
        }

        const items = res.data().chats;

        const Promises = items.map(async (item) => {
          try {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const user = userDocSnap.data();
              return { ...item, user };
            } else {
              // If user document doesn't exist, create a placeholder
              return {
                ...item,
                user: {
                  username: "Unknown User",
                  avatar: "./avatar.png",
                  id: item.receiverId,
                  blocked: []
                }
              };
            }
          } catch (error) {
            console.log("Error fetching user data for:", item.receiverId, error);
            // Return a placeholder user object when there's a permission error
            return {
              ...item,
              user: {
                username: "User",
                avatar: "./avatar.png",
                id: item.receiverId,
                blocked: []
              }
            };
          }
        });

        const chatData = await Promise.all(Promises);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      },
      (error) => {
        console.log("Error listening to userchats:", error);
        setChats([]);
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser?.id]); // Use optional chaining

  const handleSelect = async (chat) => {
    // Check if currentUser exists before proceeding
    if (!currentUser?.id) return;

    const userChats = chats.map(item => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(item => item.chatId === chat.chatId);

    // Check if chat was found
    if (chatIndex === -1) return;

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log("Error updating chat:", err);
      // Still allow chat selection even if update fails
      changeChat(chat.chatId, chat.user);
    }
  };

  const filteredChats = chats.filter(c =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className='chatList'>
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder="Search" onChange={(e) => setInput(e.target.value)} />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className="add" onClick={() => setAddMode((prev) => !prev)} />
      </div>
      {filteredChats.map((chat) => (

        <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)} style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}>
          <img src=
            {chat.user?.blocked?.includes(currentUser.id)
              ? "./avatar.png"
              : chat.user?.avatar || "./avatar.png"
            } alt="" />
          <div className="texts">
            <span>
              {chat.user?.blocked?.includes(currentUser.id)
                ? "User"
                : chat.user?.username}
            </span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}
      {addMode && <AddUser />}
    </div>
  )
}

export default ChatList