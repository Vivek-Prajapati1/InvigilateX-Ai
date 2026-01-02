import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  
  const isProduction = process.env.NODE_ENV === "production";
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // true in production (HTTPS), false in development
    sameSite: isProduction ? "none" : "lax", // "none" required for cross-site cookies in production
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  console.log("Setting JWT cookie with options:", cookieOptions);
  console.log("Token preview:", token.substring(0, 20) + "...");
  res.cookie("jwt", token, cookieOptions);
  console.log("Cookie set successfully");
};

export default generateToken;
