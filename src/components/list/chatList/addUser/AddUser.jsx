import "./addUser.css"
import { db } from "../../../../lib/firebase"
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore"
const AddUser = () => {

  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");

      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
      }

    } catch (err) {
      console.log(err);
    }
  };

  // In handleAdd function, add better error handling:
  const handleAdd = async (e) => {
    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const chatDataForCurrent = {
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: user.id,
        updatedAt: Date.now(),
        isSeen: true,
      };

      const chatDataForOther = {
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: currentUser.id,
        updatedAt: Date.now(),
        isSeen: true,
      };

      // Safely create empty documents if not already there
      await setDoc(doc(userChatRef, currentUser.id), { chats: [] }, { merge: true });
      await setDoc(doc(userChatRef, user.id), { chats: [] }, { merge: true });

      // Add chat entry to both users
      await updateDoc(doc(userChatRef, currentUser.id), {
        chats: arrayUnion(chatDataForCurrent),
      });

      await updateDoc(doc(userChatRef, user.id), {
        chats: arrayUnion(chatDataForOther),
      });

      // Clear the user selection and close add mode
      setUser(null);

    } catch (err) {
      console.error("Error adding user:", err);
      // Add user feedback here
    }
  };

  return (
    <div className='addUser'>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && <div className="user">
        <div className="detail">
          <img src={user.avatar || "./avatar.png"} alt="" />
          <span>{user.username}</span>
        </div>
        <button onClick={handleAdd}>Add User</button>
      </div>}
    </div>
  )
}

export default AddUser