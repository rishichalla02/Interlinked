import { useEffect } from "react";
import Chat from "./components/chat/Chat"
import Detail from "./components/detail/Detail"
import List from "./components/list/List"
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

const App = () => {

  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        fetchUserInfo(user.uid);
      } else {
        // User is signed out - clear the user store
        useUserStore.setState({ currentUser: null, isLoading: false });
        // Also clear chat store when user logs out
        useChatStore.setState({ 
          chatId: null, 
          user: null, 
          isCurrentUserBlocked: false, 
          isReceiverBlocked: false 
        });
      }
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);  

  if (isLoading) return <div className="loading">Loading..</div>

  return (
    <div className='container'>
      {
        currentUser ? (
          <>
            <List />
            {chatId && <Chat />}
            {chatId && <Detail />}
          </>
        ) : (
          <Login />
        )}
      <Notification />
    </div>
  )
}

export default App