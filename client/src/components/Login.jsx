import { useState } from "react";
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom";
export default function Login() {
    const {signin}=useAuth();
    const navigate=useNavigate();
    const [email,Setemail]=useState("");
    const [password,Setpassword]=useState("");
    const [err,Seterr]=useState("");
    const [iserr,Setiserr]=useState('');

    async function singin() {
         try{
            const credentials={email,password}
           const response=await signin(credentials);
           console.log("success ${}");
           console.log(response);
           if(response.role==="patient"){
              navigate('/patient')
           }else{
              navigate('/doctor')
           }
   
       }catch(err){
           Setiserr(true);
            Seterr(err);

         }
    }


    return(
      <div> 
          <div>
             <input placeholder="email" onChange={(e)=>Setemail(e.target.value)}/>
             <input placeholder="password" onChange={(e)=>Setpassword(e.target.value)}/>

             <button onClick={singin}>
                Click Me
             </button>

          </div>
      </div>
    )
}