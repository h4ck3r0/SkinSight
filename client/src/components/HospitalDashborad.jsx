import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
export default function HospitalDashBoard(){
    const [name,Setname]=useState("");
    const [phone,SetPhone]=useState("");
    const [address,SetAddress]=useState("");
    const [location,Setlocation]=useState("");
    const [email,Setemail]=useState("");
    const [service,Setservice]=useState("");
    const [hospital,Sethospital]=useState([]);
    const [err,Seterr]=useState("");
    const {token,user}=useAuth();
    console.log(token,user);

    useEffect(()=>{
        hospitaldetails()
    },[hospital])
    async function hospitaldetails(){
        try{
            const hospitalId=user.hospitalId;
            const response=await axios.get("https://mycarebridge.onrender.com/api/hospital/${hospitalId}",{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            });
            Sethospital(response.data)
            console.log(response.data);
        }catch(err){
          err && Seterr(err.response.data);
        }
    }

    async function createHospital(){
       try{
        const response=await axios.post("https://mycarebridge.onrender.com/api/hospital/addhospital",{
            name,phone,address,location,email,service
        },{
            headers:{
                Authorization:`Bearer ${token}`
            }
        });
       }catch(err){
        err && Seterr(err.response.data);
       }
    }
    return(
        <div>
            <div>
                Create Hospital 
             <div>
            <input placeholder="name" onChange={(e)=>Setname(e.target.value)}/>
            <input placeholder="phone" onChange={(e)=>SetPhone(e.target.value)}/>
            <input placeholder="address" onChange={(e)=>Setemail(e.target.value)}/>
            <input placeholder="location" onChange={(e)=>Setlocation(e.target.value)}/>
            <input placeholder="email" onChange={(e)=>Setemail(e.target.value)}/>
            <input placeholder="service" onChange={(e)=>Setservice(e.target.value)}/>

            <button onClick={createHospital}>
                Click me 
            </button>
        </div>

        <div>
            <div>
                <h4>Add doctor</h4>
            </div>
        </div>

        <div>
            <div>
                <h4>Update hospital</h4>
            </div>
        </div>
              
            </div>
        </div>
    )

}
