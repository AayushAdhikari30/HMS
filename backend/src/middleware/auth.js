import { verifyAccessToken } from "../config/jwt.js";
import { User } from "../models/index.js";
import { HTTP } from "../constants.js";

export const authenticate = async (req , res , next ) => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader?.startsWith("Bearer"))
        {
            return res.status(HTTP.UNAUTHORIZED).json({message : "No token provided"});
        }
        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);

        const user = await User.findByPk(decoded.id,{
            attributes: {exclude: ["password_hash"]},
        });
        if(!user || !user.is_active){
            return res.status(HTTP.UNAUTHORIZED).json({message: "User not found or inactive"});
        }
        req.user = user;
        next();
    }
    catch{
        return res.status(HTTP.UNAUTHORIZED).json({message: "Invalid or expired Token"});
    }
};

export const authorise = (...roles) => (req,res,next) => {
    if(!roles.includes(req.user?.role))
    {
        return res.status(HTTP.FORBIDDEN).json({message: "Access denied"});
    }
    next();
};