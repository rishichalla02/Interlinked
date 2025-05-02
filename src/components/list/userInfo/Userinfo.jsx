import "./userInfo.css"
import {useUserStore} from "../../../lib/userStore"
const Userinfo = () => {

    const {currentUser} = useUserStore();
    return (
        <div className='userInfo'>
            <div className="user">
                <img src={currentUser.avatar || "./favicon.png"} alt="" />
                <pre><h3>{currentUser.username}</h3></pre>
            </div>
            <div className="icons">
                <img src="./more.png" alt="" />
                <img src="./video.png" alt="" />
                <img src="./edit.png" alt="" />
            </div>
        </div>
    )
}

export default Userinfo