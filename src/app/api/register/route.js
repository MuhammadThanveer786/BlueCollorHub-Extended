import Activity from "@/models/Activity";

// Inside your POST register function...
const newUser = await User.create({ ... });

// 🚨 ADD THIS LINE:
await Activity.create({
  action: "new_user",
  details: `${newUser.name} just joined the platform!`,
  userId: newUser._id
});